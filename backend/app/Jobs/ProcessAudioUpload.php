<?php

namespace App\Jobs;

use App\Models\Track;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;
use App\FFMpeg\NativeAac;

class ProcessAudioUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $track;
    public $r2Key;

    public function __construct(Track $track, string $r2Key)
    {
        $this->track = $track;
        $this->r2Key = $r2Key;
    }

    public function handle(): void
    {
        $lowBitrate  = (new NativeAac)->setAudioKiloBitrate(64);
        $midBitrate  = (new NativeAac)->setAudioKiloBitrate(128);
        $highBitrate = (new NativeAac)->setAudioKiloBitrate(320);

        FFMpeg::fromDisk('r2')
            ->open($this->r2Key)
            ->exportForHLS()
            ->addFormat($lowBitrate)
            ->addFormat($midBitrate)
            ->addFormat($highBitrate)
            ->toDisk('r2')
            ->save("audio/{$this->track->id}/playlist.m3u8");

        $this->track->update([
            'hls_path' => "audio/{$this->track->id}/playlist.m3u8",
            'status' => 'ready'
        ]);
    }
}
