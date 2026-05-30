<?php

namespace App\Jobs;

use App\Models\PodcastEpisode;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;
use FFMpeg\Format\Audio\Aac;
use FFMpeg\Format\Video\X264;
use FFMpeg\Filters\Audio\CustomFilter;
use Illuminate\Support\Facades\Storage;

class ProcessPodcastJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $episode;
    public $r2Key;
    public $mediaType;

    public $timeout = 3600; // 1 hour timeout for massive podcasts

    public function __construct(PodcastEpisode $episode, string $r2Key, string $mediaType)
    {
        $this->episode = $episode;
        $this->r2Key = $r2Key;
        $this->mediaType = $mediaType;
    }

    public function handle(): void
    {
        // 1. Audio Normalization & Transcoding (HLS)
        // We use Aac format and add a loudnorm filter for podcast dialogue leveling.
        $lowBitrate = (new Aac)->setAudioKiloBitrate(64);
        $midBitrate = (new Aac)->setAudioKiloBitrate(128);
        $highBitrate = (new Aac)->setAudioKiloBitrate(320);

        $hlsBasePath = "podcasts/{$this->episode->id}/playlist.m3u8";

        if ($this->mediaType === 'podcast_audio') {
            FFMpeg::fromDisk('r2')
                ->open($this->r2Key)
                ->addFilter(function ($filters) {
                    $filters->custom('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
                })
                ->exportForHLS()
                ->addFormat($lowBitrate)
                ->addFormat($midBitrate)
                ->addFormat($highBitrate)
                ->toDisk('r2')
                ->save($hlsBasePath);

            // Generate Waveform Image
            $waveformPath = "podcasts/{$this->episode->id}/waveform.png";
            FFMpeg::fromDisk('r2')
                ->open($this->r2Key)
                ->export()
                ->addFormat(new \FFMpeg\Format\Video\WebM) // Dummy format to allow custom parameters
                ->custom([
                    '-filter_complex', 'showwavespic=s=1200x240:colors=#1db954',
                    '-frames:v', '1'
                ])
                ->toDisk('r2')
                ->save($waveformPath);

            $this->episode->update([
                'hls_path' => $hlsBasePath,
                'waveform_url' => $waveformPath,
                'status' => 'ready'
            ]);

        } elseif ($this->mediaType === 'podcast_video') {
            // Video Podcasts (e.g. Joe Rogan style)
            $lowVideo = (new X264('aac'))->setKiloBitrate(500);
            $midVideo = (new X264('aac'))->setKiloBitrate(1000);
            $highVideo = (new X264('aac'))->setKiloBitrate(2500);

            FFMpeg::fromDisk('r2')
                ->open($this->r2Key)
                ->exportForHLS()
                ->addFormat($lowVideo)
                ->addFormat($midVideo)
                ->addFormat($highVideo)
                ->toDisk('r2')
                ->save($hlsBasePath);

            $this->episode->update([
                'hls_path' => $hlsBasePath,
                'status' => 'ready'
            ]);
        }
    }
}
