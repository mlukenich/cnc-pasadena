# Converts staged NODRaiderTank.xml to use CRROUNDABOUT_SKIN and Portrait_ColumbiaRoundabout.
function ConvertTo-RoundaboutObjectContent([string]$Content) {
    $document = New-Object Xml.XmlDocument
    $document.PreserveWhitespace = $true
    $document.LoadXml($Content)
    $namespace = New-Object Xml.XmlNamespaceManager($document.NameTable)
    $namespace.AddNamespace('a', 'uri:ea.com:eala:asset')

    $objects = $document.SelectNodes('/a:AssetDeclaration/a:GameObject[@id="NODRaiderTank"]', $namespace)
    if ($objects.Count -ne 1) { throw 'Expected exactly one stock-derived NODRaiderTank.' }
    $object = $objects[0]

    $draws = $object.SelectNodes('a:Draws/a:TankDraw', $namespace)
    if ($draws.Count -ne 1) { throw 'Expected exactly one Raider TankDraw.' }
    $models = $draws[0].SelectNodes('a:ModelConditionState/a:Model', $namespace)

    foreach ($model in $models) {
        $model.SetAttribute('Name', 'CRROUNDABOUT_SKIN')
    }

    # Remove stock texture replacement on damaged states
    $textures = $draws[0].SelectNodes('a:ModelConditionState/a:Texture', $namespace)
    foreach ($tex in $textures) {
        $tex.ParentNode.RemoveChild($tex) | Out-Null
    }

    $object.SetAttribute('SelectPortrait', 'Portrait_ColumbiaRoundabout')
    $object.SetAttribute('ButtonImage', 'Portrait_ColumbiaRoundabout')

    $geometries = $object.SelectNodes('a:Geometry', $namespace)
    if ($geometries.Count -ne 1) { throw 'Expected exactly one Raider Geometry.' }
    $geometry = $geometries[0]
    $shapes = $geometry.SelectNodes('a:Shape', $namespace)
    if ($shapes.Count -ne 1 -or $shapes[0].GetAttribute('Type') -ne 'BOX') {
        throw 'Expected a single BOX; review footprint before building.'
    }
    $shape = $shapes[0]

    # Roundabout Tank dimensions: length ~46 (radius 24.0), width ~22 (radius 12.0), height ~22 (height 22.5)
    $geometry.SetAttribute('IsSmall', 'false')
    $shape.SetAttribute('MajorRadius', '24.0')
    $shape.SetAttribute('MinorRadius', '12.0')
    $shape.SetAttribute('Height', '22.5')
    $shape.RemoveAttribute('Offset') | Out-Null
    $offsets = $shape.SelectNodes('a:Offset', $namespace)
    foreach ($o in $offsets) { $shape.RemoveChild($o) | Out-Null }

    return $document.OuterXml
}
