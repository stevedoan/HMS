<?php

/*
 Lumen doesn't support JSON data via put request, we need to use post
*/

$app->get('/', function () {
    return redirect('/index.html');
});

$app->get('/login', 'LoginController@login');
$app->get('/loginCallBack', 'LoginController@callBack');

$app->group(['middleware' => 'auth', 'namespace' => 'App\Http\Controllers'],
    function () use ($app) {
        $app->get('user', 'UserController@get');
        $app->delete('user', 'UserController@remove');

        $app->get('constructions', 'ConstructionController@getUserConstructions');
        $app->get('construction/{id}','ConstructionController@get');
        $app->post('construction', 'ConstructionController@add'); //require: construction
        $app->post('construction/{id}', 'ConstructionController@update'); //require: construction
        $app->delete('construction/{id}', 'ConstructionController@remove');

        $app->get('categories/{construction_id}', 'CategoryController@getCategoriesByConstruction');
        $app->post('category', 'CategoryController@add'); //require: construction_id, name
        $app->post('category/{id}', 'CategoryController@update'); //require: name
        $app->delete('category/{id}', 'CategoryController@remove');

        $app->get('subcategories/{category_id}', 'SubCategoryController@getSubcategoriesByCategory');
        $app->post('subcategory', 'SubCategoryController@add'); //require: category_id, name
        $app->post('subcategory/{id}', 'SubCategoryController@update'); //require: name
        $app->delete('subcategory/{id}', 'SubCategoryController@remove');

        $app->get('works', 'WorkController@getAll'); //require: construction_id

        $app->get('suppliers', 'SupplierController@getAll');

        $app->get('categoryWorks/{category_id}', 'SubcategoryWorkController@getWorks');
        $app->post('subcategoryWork', 'SubcategoryWorkController@add'); //require: subcategory_id, work_id || subcategory_id, new_work_code, old_work_code
        $app->post('subcategoryWork/{subcategory_id}/{work_code}', 'SubcategoryWorkController@update'); //require: value, no
        $app->delete('subcategoryWork/{subcategory_id}/{work_code}', 'SubcategoryWorkController@remove');

        $app->post('description', 'DescriptionController@add'); //require: subcategory_id, work_code
        $app->post('description/{id}', 'DescriptionController@update'); //require: description
        $app->delete('description/{id}', 'DescriptionController@remove');
    });