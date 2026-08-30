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

    # Sweeper dimensions: length ~42 (radius 22.0), width ~29 (radius 15.0), height ~22 (height 22.0)
    $geometry.SetAttribute('IsSmall', 'false')
    $shape.SetAttribute('MajorRadius', '22.0')
    $shape.SetAttribute('MinorRadius', '15.0')
    $shape.SetAttribute('Height', '22.0')
    $shape.RemoveAttribute('Offset') | Out-Null
    $offsets = $shape.SelectNodes('a:Offset', $namespace)
    foreach ($o in $offsets) { $shape.RemoveChild($o) | Out-Null }

    return $document.OuterXml
}
