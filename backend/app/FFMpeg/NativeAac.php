<?php

namespace App\FFMpeg;

use FFMpeg\Format\Audio\DefaultAudio;

/**
 * Custom AAC audio format that uses the built-in 'aac' encoder
 * instead of 'libfdk_aac', which is not included in standard
 * Ubuntu/Debian FFmpeg builds due to licensing restrictions.
 */
class NativeAac extends DefaultAudio
{
    public function getAvailableAudioCodecs(): array
    {
        return ['aac'];
    }

    public function getAudioCodec(): string
    {
        return 'aac';
    }
}
