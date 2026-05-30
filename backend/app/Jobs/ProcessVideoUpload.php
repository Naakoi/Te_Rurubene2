<?php

namespace App\Jobs;

use App\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;
use FFMpeg\Format\Video\X264;

class ProcessVideoUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $video;
    public $r2Key;

    public function __construct(Video $video, string $r2Key)
    {
        $this->video = $video;
        $this->r2Key = $r2Key;
    }

    public function handle(): void
    {
        $lowBitrate = (new X264('aac'))->setKiloBitrate(250);
        $midBitrate = (new X264('aac'))->setKiloBitrate(500);
        $highBitrate = (new X264('aac'))->setKiloBitrate(1000);
        $superBitrate = (new X264('aac'))->setKiloBitrate(2500);

        // Thumbnail extraction
        FFMpeg::fromDisk('r2')
            ->open($this->r2Key)
            ->getFrameFromSeconds(2)
            ->export()
            ->toDisk('r2')
            ->save("videos/{$this->video->id}/thumb.jpg");

        // HLS Transcoding
        FFMpeg::fromDisk('r2')
            ->open($this->r2Key)
            ->exportForHLS()
            ->addFormat($lowBitrate, function($media) { $media->addFilter('scale=256:144'); })   // 144p
            ->addFormat($lowBitrate, function($media) { $media->addFilter('scale=426:240'); })   // 240p
            ->addFormat($midBitrate, function($media) { $media->addFilter('scale=640:360'); })   // 360p
            ->addFormat($highBitrate, function($media) { $media->addFilter('scale=854:480'); })  // 480p
            ->addFormat($superBitrate, function($media) { $media->addFilter('scale=1280:720'); }) // 720p
            ->toDisk('r2')
            ->save("videos/{$this->video->id}/playlist.m3u8");

        // Update video record
        $this->video->update([
            'hls_path' => "videos/{$this->video->id}/playlist.m3u8",
            'status' => 'ready'
        ]);
    }
}
