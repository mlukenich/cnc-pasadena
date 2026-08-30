@echo off
@echo Map Name: %1 

IF NOT EXIST "%cd%\Mods\maps" md "%cd%\Mods\maps"
IF NOT EXIST "%cd%\Mods\maps\%1" md "%cd%\Mods\maps\%1"
copy "%APPDATA%\Command & Conquer 3 Tiberium Wars\maps\%1\*.*" "%cd%\Mods\maps\%1"

@echo Building Mod Data...
tools\binaryAssetBuilder.exe "%cd%\Mods\maps\%1\map.xml" /od:"%cd%\BuiltMods" /iod:"%cd%\BuiltMods" /ls:false /gui:false /UsePrecompiled:true /LinkedStreams:true

@echo Fixing Map Data....
tools\AssetResolver.exe -m "%cd%\BuiltMods\mods\maps\%1\map.manifest" -s map

copy "%cd%\BuiltMods\mods\maps\%1\map.manifest" "%APPDATA%\Command & Conquer 3 Tiberium Wars\maps\%1"
copy "%cd%\BuiltMods\mods\maps\%1\map.bin" "%APPDATA%\Command & Conquer 3 Tiberium Wars\maps\%1"
copy "%cd%\BuiltMods\mods\maps\%1\map.relo" "%APPDATA%\Command & Conquer 3 Tiberium Wars\maps\%1"
copy "%cd%\BuiltMods\mods\maps\%1\map.imp" "%APPDATA%\Command & Conquer 3 Tiberium Wars\maps\%1"

del "%cd%\Mods\maps\%1\*.*" /Q
rd "%cd%\Mods\maps\%1"
rd "%cd%\Mods\maps"

del "%cd%\BuiltMods\mods\maps\%1\map\assets\*.*" /Q
rd "%cd%\BuiltMods\mods\maps\%1\map\assets"
rd "%cd%\BuiltMods\mods\maps\%1\map"
del "%cd%\BuiltMods\mods\maps\%1\*.*" /Q
rd "%cd%\BuiltMods\mods\maps\%1"
rd "%cd%\BuiltMods\mods\maps"