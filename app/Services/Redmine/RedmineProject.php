<?php

namespace App\Services\Redmine;

use App\Services\Redmine\RedmineProjectCollection;
use Redmine\Client;
use App\Models\Construction;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\SubcategoryWork;
use App\Models\Work;
use App\Models\Description;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RedmineProject {

	const PROJECT_PREFIX = 'hms';
	private $client;
	private $redmineCollectionUtil;

	function __construct($redmineSetting) {
		$this->client = new Client( $redmineSetting->redmine_url, $redmineSetting->api_access_key );
		$this->redmineCollectionUtil = new RedmineProjectCollection($redmineSetting);
	}

	/*
	 *	Author: Doan Phuc Sinh
	 *	Summary: Get the project with all its childs
	 *	Return: The projects array
	 */
	function get() {
		return $this->redmineCollectionUtil->getAllRootProject();
	}

	function addConstruction($userId, $constructionId) {
		$construction = Construction::find($constructionId);
		$result = $this->client->project->create([
			'name' 			=> $construction->name,
		    'identifier' 	=> 'hms-construction-' . $userId . "-" . $constructionId,
		    'tracker_ids' 	=> [],
		    'is_public' 	=> 0,
		]);

		$categories = Category::where('construction_id', $constructionId)->get();
		foreach ( $categories as $category ) {
			$this->addCategory($userId, $category->id, $result->id);
		}
		
		return $result;
	}

	function addCategories($userId, $categoryIdList) {
		foreach ($categoryIdList as $categoryId) {
			$this->addCategory($userId, $categoryId);
		}
	}

	function addCategory($userId, $categoryId, $constructionProjectId = NULL) {
		$category = Category::find($categoryId);
		$result = $this->client->project->create([
			'name' 			=> $category->name,
		    'identifier' 	=> 'hms-category-' . $userId . "-" . $categoryId,
		    'parent_id' 	=> $constructionProjectId,
		    'tracker_ids' 	=> [],
		    'is_public' 	=> 0,
		]);
		$subcategories = Subcategory::where('category_id', $categoryId)->get();
		foreach ( $subcategories as $subcategory ) {
			$this->addSubcategory($userId, $subcategory->id, $result->id);
		}
		return $result;
	}

	private function addSubcategory($userId, $subcategoryId, $categoryProjectId) {
		$subcategory = Subcategory::find($subcategoryId);
		$result = NULL;
		if ( !empty($subcategory->name) ) {
				$result = $this->client->project->create([
				'name' 			=> $subcategory->name,
			    'identifier' 	=> 'hms-subcategory' . $userId . "-" . $subcategoryId,
			    'parent_id' 	=> $categoryProjectId,
			    'tracker_ids' 	=> [],
			    'is_public' 	=> 0,
			]);
			
		}
		$subcategoryWorks = SubcategoryWork::where('subcategory_id', $subcategoryId)->get();
		if ( !is_null($result) ) {
			$categoryProjectId = $result->id;
		}
		foreach ( $subcategoryWorks as $subcategoryWork ) {
			$this->addWork($userId, $subcategoryWork->id, $categoryProjectId);
		}
	}

	private function addWork($userId, $subcategoryWorkId, $categoryProjectId) {
		$work = Work::join('subcategory_work', 'subcategory_work.work_id', '=', 'works.id')
			->where('subcategory_work.id', $subcategoryWorkId)->first();

		$workDescriptions = $this->getWorkDescriptions($subcategoryWorkId);

		// data to get category and subcategory name
		$data = DB::table('subcategory_work')
			->join('subcategories', 'subcategory_work.subcategory_id', '=', 'subcategories.id')
			->join('categories', 'subcategories.category_id', '=', 'categories.id')
			->where('subcategory_work.id', $subcategoryWorkId)
			->select('categories.name as category_name', 'subcategories.name as subcategory_name')
			->first();

		$work_prefix = '[' . $data->category_name . ']';
		$work_prefix .= $data->subcategory_name != '' ? '[' . $data->subcategory_name . ']' : '';

		$this->client->issue->create([
		    'project_id' => $categoryProjectId,
		    'tracker_id' => 2,
		    'subject' => $work_prefix . $work->name,
		    'description' => $workDescriptions,
		    'assigned_to_id' => NULL,
		    'custom_fields' => [],
		    'watcher_user_ids' => [],
		]);
	}

	private function getWorkDescriptions($subcategoryWorkId) {
		$descriptionString = "";
		$descriptions = Description::where('subcategoryWork_id', $subcategoryWorkId)->get();
		if ( $descriptions->count() > 0 ) {
			foreach ( $descriptions as $description ) {
				$descriptionString .= ($description->no + 1) . ") " . $description->name . " - Số lượng: " . $description->amount . "\n" .
					"\t" . "Khối lượng (Dài x Rộng x Cao): " . $description->value . " (" . 
					$description->length . " x " . $description->width . " x " . $description->height . ")\n";
			}
		}
		return $descriptionString;
	}
}