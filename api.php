<?php
define('YII_DEBUG', true);
define('YII_ENV', 'dev');

require_once '../vendor/yiisoft/yii2/Yii.php';
require_once '../config/web.php';
require_once ROOT . '/vendor/autoload.php';

$app = new \yii\web\Application($config);



//$app->run();
