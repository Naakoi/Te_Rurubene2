<?php

namespace App\Http\Controllers;

use App\Models\PodcastCategory;
use Illuminate\Http\Request;

class PodcastCategoryController extends Controller
{
    public function index()
    {
        return response()->json(PodcastCategory::all());
    }
}
