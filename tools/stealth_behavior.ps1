function ConvertTo-StealthObjectContent([string]$Content) {
    # Replace portraits
    $Content = [regex]::Replace($Content, 'SelectPortrait="[^"]*"', 'SelectPortrait="Portrait_ColumbiaStealth"')
    $Content = [regex]::Replace($Content, 'ButtonImage="[^"]*"', 'ButtonImage="Portrait_ColumbiaStealth"')

    # Replace model skin names
    $Content = [regex]::Replace($Content, '<Model\s+Name="NUStlthTnk_SKN"\s*/>', '<Model Name="CTSTEALTH_SKIN" />')
    $Content = [regex]::Replace($Content, '<Model\s+Name="NUStlthTnkR_SKN"\s*/>', '<Model Name="CTSTEALTH_SKIN" />')
    $Content = [regex]::Replace($Content, '<Model\s+Name="NUStlthTnk_FP"\s*/>', '<Model Name="CTSTEALTH_SKIN" />')

    # Fit physical simulation box and collision geometry
    $Content = [regex]::Replace($Content, 'MajorRadius="\d+(\.\d+)?"', 'MajorRadius="23.0"')
    $Content = [regex]::Replace($Content, 'MinorRadius="\d+(\.\d+)?"', 'MinorRadius="12.0"')
    $Content = [regex]::Replace($Content, 'Height="\d+(\.\d+)?"', 'Height="14.0"')

    return $Content
}
