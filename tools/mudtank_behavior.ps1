# Converts staged GDIPredator.xml to use PVMUDTANK_SKIN and Portrait_PasadenaMudTank.
function ConvertTo-MudTankObjectContent([string]$Content) {
    $document = New-Object Xml.XmlDocument
    $document.PreserveWhitespace = $true
    $document.LoadXml($Content)
    $namespace = New-Object Xml.XmlNamespaceManager($document.NameTable)
    $namespace.AddNamespace('a', 'uri:ea.com:eala:asset')

    $objects = $document.SelectNodes('/a:AssetDeclaration/a:GameObject[@id="GDIPredator"]', $namespace)
    if ($objects.Count -ne 1) { throw 'Expected exactly one stock-derived GDIPredator.' }
    $object = $objects[0]

    $draws = $object.SelectNodes('a:Draws/a:TankDraw', $namespace)
    if ($draws.Count -ne 1) { throw 'Expected exactly one Predator TankDraw.' }
    $models = $draws[0].SelectNodes('a:ModelConditionState/a:Model', $namespace)

    foreach ($model in $models) {
        $model.SetAttribute('Name', 'PVMUDTANK_SKIN')
    }

    # Remove stock texture replacement on damaged states
    $textures = $draws[0].SelectNodes('a:ModelConditionState/a:Texture', $namespace)
    foreach ($tex in $textures) {
        $tex.ParentNode.RemoveChild($tex) | Out-Null
    }

    # TankDraw only drives tread UVs; wheel bones alone cannot make it roll tires.
    # Convert the visual module to TruckDraw, preserving weapon/turret/FX states.
    $tankDraw = $draws[0]
    $truckDraw = $document.CreateElement('TruckDraw', $tankDraw.NamespaceURI)
    foreach ($attribute in @($tankDraw.Attributes)) {
        if ($attribute.Name -notin @('TreadAnimationRate','TreadDriveSpeedFraction','TreadPivotSpeedFraction')) {
            $truckDraw.SetAttribute($attribute.Name,$attribute.Value)
        }
    }
    foreach ($child in @($tankDraw.ChildNodes)) {
        if ($child.LocalName -notin @('LeftTread','RightTread','AnimationState')) {
            [void]$truckDraw.AppendChild($child.CloneNode($true))
        }
        elseif ($child.LocalName -eq 'AnimationState') {
            # Stock Predator states only toggle tread meshes absent from this art.
            # Reject future animation/FX content rather than silently discarding it.
            if (@($child.ChildNodes | Where-Object { $_.NodeType -eq 'Element' -and $_.LocalName -ne 'Script' }).Count) { throw 'Predator animation state changed; review conversion.' }
        }
    }
    [void]$tankDraw.ParentNode.ReplaceChild($truckDraw,$tankDraw)
    $truckDraw.SetAttribute('LeftFrontTireBone','Bone_TireLF')
    $truckDraw.SetAttribute('RightFrontTireBone','Bone_TireRF')
    $truckDraw.SetAttribute('LeftRearTireBone','Bone_TireLR')
    $truckDraw.SetAttribute('RightRearTireBone','Bone_TireRR')
    # Nominal 8-unit tire radius at artScale 1.10: radians per unit travelled.
    $truckDraw.SetAttribute('TireRotationMultiplier','0.11363636')
    $truckDraw.SetAttribute('TrackMarks','EXTireTrack2')
    $truckDraw.SetAttribute('TrackMarksLeftBone','Bone_TireLR')
    $truckDraw.SetAttribute('TrackMarksRightBone','Bone_TireRR')
    $trackInclude = $document.SelectSingleNode('/a:AssetDeclaration/a:Includes/a:Include[@source="ART:EXTnkTrack.xml"]',$namespace)
    if ($null -eq $trackInclude) { throw 'Predator track include changed.' }
    $trackInclude.SetAttribute('source','ART:EXTireTrack2.xml')

    $object.SetAttribute('SelectPortrait', 'Portrait_PasadenaMudTank')
    $object.SetAttribute('ButtonImage', 'Portrait_PasadenaMudTank')

    $geometries = $object.SelectNodes('a:Geometry', $namespace)
    if ($geometries.Count -ne 1) { throw 'Expected exactly one Predator Geometry.' }
    $geometry = $geometries[0]
    $shapes = $geometry.SelectNodes('a:Shape', $namespace)
    if ($shapes.Count -ne 1 -or $shapes[0].GetAttribute('Type') -ne 'BOX') {
        throw 'Expected a single BOX; review footprint before building.'
    }
    $shape = $shapes[0]

    # 25% larger art: X -27.940..30.085, Y +/-16.805, Z <=30.910.
    # Wider collision affects spacing/pathing; height affects targeting contacts.
    $geometry.SetAttribute('IsSmall', 'false')
    $shape.SetAttribute('MajorRadius', '31.0')
    $shape.SetAttribute('MinorRadius', '18.0')
    $shape.SetAttribute('Height', '31.0')

    return $document.OuterXml
}
