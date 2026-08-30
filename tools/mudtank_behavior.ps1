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

    # Revision 2: widened tires and raised turret; bounds ~48.2 x 26.9 x 24.8.
    # Wider collision affects spacing/pathing; height affects targeting contacts.
    $geometry.SetAttribute('IsSmall', 'false')
    $shape.SetAttribute('MajorRadius', '25.0')
    $shape.SetAttribute('MinorRadius', '14.0')
    $shape.SetAttribute('Height', '25.0')

    return $document.OuterXml
}
