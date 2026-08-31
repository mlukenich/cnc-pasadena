# Converts staged NODFlameTank.xml to use CSSWEEPER_SKIN and Portrait_ColumbiaSweeper.
function ConvertTo-SweeperObjectContent([string]$Content) {
    $document = New-Object Xml.XmlDocument
    $document.PreserveWhitespace = $true
    $document.LoadXml($Content)
    $namespace = New-Object Xml.XmlNamespaceManager($document.NameTable)
    $namespace.AddNamespace('a', 'uri:ea.com:eala:asset')

    $objects = $document.SelectNodes('/a:AssetDeclaration/a:GameObject[@id="NODFlameTank"]', $namespace)
    if ($objects.Count -ne 1) { throw 'Expected exactly one stock-derived NODFlameTank.' }
    $object = $objects[0]

    $draws = $object.SelectNodes('a:Draws/a:TankDraw', $namespace)
    if ($draws.Count -ne 1) { throw 'Expected exactly one FlameTank TankDraw.' }
    $models = $draws[0].SelectNodes('a:ModelConditionState/a:Model', $namespace)

    foreach ($model in $models) {
        $model.SetAttribute('Name', 'CSSWEEPER_SKIN')
    }

    # Remove stock texture replacements on damaged states
    $textures = $draws[0].SelectNodes('a:ModelConditionState/a:Texture', $namespace)
    foreach ($tex in $textures) {
        $tex.ParentNode.RemoveChild($tex) | Out-Null
    }

    # TruckDraw supplies actual distance-linked wheel roll and front steering.
    # Preserve stock combat behavior; replace only the visual draw mechanics.
    $tankDraw = $draws[0]
    $truckDraw = $document.CreateElement('TruckDraw', $tankDraw.NamespaceURI)
    foreach ($attribute in @($tankDraw.Attributes)) {
        if ($attribute.Name -notin @('TreadAnimationRate','TreadDriveSpeedFraction','TreadPivotSpeedFraction')) {
            $truckDraw.SetAttribute($attribute.Name,$attribute.Value)
        }
    }
    foreach ($child in @($tankDraw.ChildNodes)) {
        if ($child.LocalName -notin @('LeftTread','RightTread')) { [void]$truckDraw.AppendChild($child.CloneNode($true)) }
    }
    [void]$tankDraw.ParentNode.ReplaceChild($truckDraw,$tankDraw)
    $truckDraw.SetAttribute('LeftFrontTireBone','Bone_TireLF')
    $truckDraw.SetAttribute('RightFrontTireBone','Bone_TireRF')
    $truckDraw.SetAttribute('LeftRearTireBone','Bone_TireLR')
    $truckDraw.SetAttribute('RightRearTireBone','Bone_TireRR')
    $truckDraw.SetAttribute('TireRotationMultiplier','0.1923077')
    $truckDraw.SetAttribute('TrackMarks','EXTireTrack2')
    $truckDraw.SetAttribute('AnimationsRequirePower','false')
    foreach ($turret in $truckDraw.SelectNodes('a:ModelConditionState/a:Turret',$namespace)) { $turret.SetAttribute('TurretPitch','GunPitch') }
    foreach ($state in $truckDraw.SelectNodes('a:AnimationState',$namespace)) {
        if ($state.GetAttribute('ConditionsYes') -match 'DYING|RUBBLE|FREEFALL') { continue }
        $animation=$document.CreateElement('Animation',$truckDraw.NamespaceURI)
        $animation.SetAttribute('AnimationName','CSSWEEPER_SCRUB')
        $animation.SetAttribute('AnimationMode','LOOP')
        $animation.SetAttribute('AnimationBlendTime','0')
        [void]$state.PrependChild($animation)
    }

    $object.SetAttribute('SelectPortrait', 'Portrait_ColumbiaSweeper')
    $object.SetAttribute('ButtonImage', 'Portrait_ColumbiaSweeper')

    $geometries = $object.SelectNodes('a:Geometry', $namespace)
    if ($geometries.Count -ne 1) { throw 'Expected exactly one FlameTank Geometry.' }
    $geometry = $geometries[0]
    $shapes = $geometry.SelectNodes('a:Shape', $namespace)
    if ($shapes.Count -ne 1 -or $shapes[0].GetAttribute('Type') -ne 'BOX') {
        throw 'Expected a single BOX; review footprint before building.'
    }
    $shape = $shapes[0]

    # Includes the outboard scrubbers and their complete rotation envelope.
    # Larger than the old 44x30x22 box: 50x38x26 affects spacing/pathing/targeting.
    $geometry.SetAttribute('IsSmall', 'false')
    $shape.SetAttribute('MajorRadius', '25.0')
    $shape.SetAttribute('MinorRadius', '19.0')
    $shape.SetAttribute('Height', '26.0')
    $shape.RemoveAttribute('Offset') | Out-Null
    $offsets = $shape.SelectNodes('a:Offset', $namespace)
    foreach ($o in $offsets) { $shape.RemoveChild($o) | Out-Null }

    return $document.OuterXml
}
