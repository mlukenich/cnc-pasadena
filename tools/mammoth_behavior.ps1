function ConvertTo-MammothObjectContent([string]$Content) {
    # Replace portraits
    $Content = [regex]::Replace($Content, 'SelectPortrait="[^"]*"', 'SelectPortrait="Portrait_PasadenaMammoth"')
    $Content = [regex]::Replace($Content, 'ButtonImage="[^"]*"', 'ButtonImage="Portrait_PasadenaMammoth"')

    # Replace model skin name
    $Content = [regex]::Replace($Content, '<Model\s+Name="GUMamm_SKN"\s*/>', '<Model Name="PJMAMMOTH_SKIN" />')
    $Content = [regex]::Replace($Content, '<Model\s+Name="GUMamm_R"\s*/>', '<Model Name="PJMAMMOTH_SKIN" />')
    $Content = [regex]::Replace($Content, '<Model\s+Name="GUMamm_FP"\s*/>', '<Model Name="PJMAMMOTH_SKIN" />')

    # Fit physical simulation box and collision geometry
    $Content = [regex]::Replace($Content, 'MajorRadius="\d+(\.\d+)?"', 'MajorRadius="35.0"')
    $Content = [regex]::Replace($Content, 'MinorRadius="\d+(\.\d+)?"', 'MinorRadius="24.0"')
    $Content = [regex]::Replace($Content, 'Height="\d+(\.\d+)?"', 'Height="28.0"')

    return $Content
}
