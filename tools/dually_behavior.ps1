# This is the lasting override for the playable stock-derived exemplar.
# src/Data/Pasadena/Units/PasadenaVehicleDually.xml is not in the live stream.
function ConvertTo-DuallyObjectContent([string]$Content) {
    $document = New-Object Xml.XmlDocument
    $document.PreserveWhitespace = $true
    $document.LoadXml($Content)
    $namespace = New-Object Xml.XmlNamespaceManager($document.NameTable)
    $namespace.AddNamespace('a', 'uri:ea.com:eala:asset')
    $objects = $document.SelectNodes('/a:AssetDeclaration/a:GameObject[@id="GDIPitbull"]', $namespace)
    if ($objects.Count -ne 1) { throw 'Expected exactly one stock-derived GDIPitbull.' }
    $object = $objects[0]
    $draws = $object.SelectNodes('a:Draws/a:TruckDraw', $namespace)
    if ($draws.Count -ne 1) { throw 'Expected exactly one Pitbull TruckDraw.' }
    $models = $draws[0].SelectNodes('a:ModelConditionState/a:Model', $namespace)
    if ($models.Count -ne 5) { throw 'Pitbull model states changed; review the dually override.' }
    foreach ($model in $models) {
        if ($model.GetAttribute('Name') -notmatch '^GUPitbull(?:(?:R)?_SKN|_FP)$') {
            throw "Unexpected Pitbull model: $($model.GetAttribute('Name'))"
        }
        $model.SetAttribute('Name', 'PVDUALLY_SKIN')
    }
    $object.SetAttribute('SelectPortrait', 'Portrait_PasadenaDually')
    $object.SetAttribute('ButtonImage', 'Portrait_PasadenaDually')

    $geometries = $object.SelectNodes('a:Geometry', $namespace)
    if ($geometries.Count -ne 1) { throw 'Expected exactly one Pitbull Geometry.' }
    $geometry = $geometries[0]
    $shapes = $geometry.SelectNodes('a:Shape', $namespace)
    if ($shapes.Count -ne 1 -or $shapes[0].GetAttribute('Type') -ne 'BOX') {
        throw 'Expected a single BOX; review footprint before building.'
    }
    $shape = $shapes[0]
    if ($shape.HasChildNodes) { throw 'Unexpected offset or child on the stock footprint.' }
    # Render bounds: X -33.836..34.980, Y +/-14.960, Z 0.014..32.576.
    # GameObject geometry, not the W3X selection/collision box, supplies the
    # simulation footprint. Radii are half-extents; retain the root at zero.
    # No global formation padding or locomotor changes: other units stay intact.
    $geometry.SetAttribute('IsSmall', 'false')
    $shape.SetAttribute('MajorRadius', '35.0')
    $shape.SetAttribute('MinorRadius', '16.0')
    $shape.SetAttribute('Height', '33.0')
    return $document.OuterXml
}
