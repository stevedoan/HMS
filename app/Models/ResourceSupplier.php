<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceSupplier extends Model
{
    protected $table = 'resource_supplier';

    protected $fillable = array('resource_code','supplier_id','price');

	public $timestamps = false;
}