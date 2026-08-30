# This is the lasting override for the playable stock-derived Columbia Prius Patrol EV.
# Converts staged NODScorpionBuggy.xml to use CUPRIUS_SKIN and Portrait_ColumbiaPrius.
function ConvertTo-PriusObjectContent([string]$Content) {
    $document = New-Object Xml.XmlDocument
    $document.PreserveWhitespace = $true
    $document.LoadXml($Content)
    $namespace = New-Object Xml.XmlNamespaceManager($document.NameTable)
    $namespace.AddNamespace('a', 'uri:ea.com:eala:asset')

    $objects = $document.SelectNodes('/a:AssetDeclaration/a:GameObject[@id="NODScorpionBuggy"]', $namespace)
    if ($objects.Count -ne 1) { throw 'Expected exactly one stock-derived NODScorpionBuggy.' }
    $object = $objects[0]

    $draws = $object.SelectNodes('a:Draws/a:TruckDraw', $namespace)
    if ($draws.Count -ne 1) { throw 'Expected exactly one Buggy TruckDraw.' }
    $models = $draws[0].SelectNodes('a:ModelConditionState/a:Model', $namespace)
    if ($models.Count -ne 5) { throw 'Buggy model states changed; review the prius override.' }

    foreach ($model in $models) {
        if ($model.GetAttribute('Name') -notmatch '^NU_Buggy(?:(?:R)?_SKN|_FP)$') {
            throw "Unexpected Buggy model: $($model.GetAttribute('Name'))"
        }
        $model.SetAttribute('Name', 'CUPRIUS_SKIN')
    }

    # Remove stock texture replacement on damaged states
    $textures = $draws[0].SelectNodes('a:ModelConditionState/a:Texture', $namespace)
    foreach ($tex in $textures) {
        $tex.ParentNode.RemoveChild($tex) | Out-Null
    }

    $object.SetAttribute('SelectPortrait', 'Portrait_ColumbiaPrius')
    $object.SetAttribute('ButtonImage', 'Portrait_ColumbiaPrius')

    $geometries = $object.SelectNodes('a:Geometry', $namespace)
    if ($geometries.Count -ne 1) { throw 'Expected exactly one Buggy Geometry.' }
    $geometry = $geometries[0]
    $shapes = $geometry.SelectNodes('a:Shape', $namespace)
    if ($shapes.Count -ne 1 -or $shapes[0].GetAttribute('Type') -ne 'BOX') {
        throw 'Expected a single BOX; review footprint before building.'
    }
    $shape = $shapes[0]

    # Columbia Prius dimensions: length ~46 (radius 24.5), width ~21.4 (radius 11.5), height ~18 (height 18.5)
    $geometry.SetAttribute('IsSmall', 'true')
    $shape.SetAttribute('MajorRadius', '24.5')
    $shape.SetAttribute('MinorRadius', '11.5')
    $shape.SetAttribute('Height', '18.5')

    return $document.OuterXml
}
