document.getElementById("browseFile").addEventListener("click", function() {
	appimg.getPhoto(function(imageData) {
//		alert(imageData);
		document.querySelector(".cutimg").style['display']='block';		
		previewInImage(imageData);
	}, true);
}, false);
//--逻辑，点击图片上传选择后将加载预览图片
var Options = {
	width: 300,
	height: 300,
	cutWidth: 200,
	cutHeight: 200,
	cutMinSize: 50, //裁剪框最小尺寸，即最小可以缩放到这个size，width及height任意一个都无法小于这个值。  

	//--系统自带，运行时自动运算，请不要修改。  
	cropViewWidth: 0, //在画布里面显示的最大宽度  
	cropViewHeight: 0, //在画布里面显示的最大高度  
	cropLeft: 0,
	cropTop: 0,
	//--裁剪框  
	cutViewWidth: 0, //当前宽度，  
	cutViewHeight: 0, //当前高度  
	cutMaxWidth: 0, //裁剪框最大宽度。  
	cutMaxHeight: 0, //裁剪框最大高度。  
	//--四象限。用于判断距离。  
	cutBoxLimitX1: 0,
	cutBoxLimitX2: 0,
	cutBoxLimitY1: 0,
	cutBoxLimitY2: 0,
	cutLeft: 0, //裁剪框绝对定位，左侧距离。  
	cutTop: 0, //裁剪框绝对定位，离顶部距离。  
	initStatus: false //当前组件是否已经初始化了。  
};
var Options_image = {
	width: 0,
	height: 0,
	imgData: ""
}

var input_browseFile = document.getElementById("browseFile");
var img_preview = document.getElementById("imgPreview");
var cutBox = document.getElementById("cutBox");
var tipBox = document.getElementById("tipBox");
var _cropper = document.getElementById("cropper");
var mainCutter = document.getElementById("mainCutter");
var tips2 = $("#tips2");
var wrapper = document.getElementById("wrapper");
var component_box = document.getElementById("component_box");

var ctx = _cropper.getContext('2d'); //ctx.drawImage(myImage, 50, 50);  
function previewInImage(file) {
	LoadingImage();
	img_preview.src = file;
}
img_preview.onload = function() {
	Options_image.width = img_preview.width;
	Options_image.height = img_preview.height;
	_initCropAndCut();
}

function LoadingImage() {
	$(img_preview).css({
		"width": "",
		"height": ""
	});
}

function _initCropAndCut() {
	//--计算比例，将其放到canvas里面。  

	var scale = Math.max(Options_image.width / Options.width, Options_image.height / Options.height);
	if(scale > 1) {
		Options.cropViewWidth = parseInt(Math.floor(Options_image.width / scale));
		Options.cropViewHeight = parseInt(Math.floor(Options_image.height / scale));
	} else {
		Options.cropViewWidth = Options_image.width;
		Options.cropViewHeight = Options_image.height;
	}
	//--计算画布里面的图像的位置。  
	Options.cropLeft = parseInt((Options.width - Options.cropViewWidth) / 2);
	Options.cropTop = parseInt((Options.height - Options.cropViewHeight) / 2);
	//--计算裁剪框实际大小及实际位置。  
	//计算裁剪框的位置。  

	var scale_2 = Math.max(Options.cutWidth / Options.cropViewWidth, Options.cutHeight / Options.cropViewHeight);
	if(scale_2 > 1) {
		Options.cutViewWidth = parseInt(Math.floor(Options.cutWidth / scale_2));
		Options.cutViewHeight = parseInt(Math.floor(Options.cutHeight / scale_2));
	} else {
		Options.cutViewHeight = Options.cutHeight;
		Options.cutViewWidth = Options.cutWidth;
	}
	Options.cutMaxWidth = Options.cutViewWidth;
	Options.cutMaxHeight = Options.cutViewHeight;

	Options.cutLeft = parseInt(Math.floor((Options.cropViewWidth - Options.cutViewWidth)) / 2);
	Options.cutTop = parseInt(Math.floor((Options.cropViewHeight - Options.cutViewHeight)) / 2);
	//-四象限。  
	Options.cutBoxLimitX1 = 0;
	Options.cutBoxLimitX2 = Options.cropViewWidth;
	Options.cutBoxLimitY1 = 0;
	Options.cutBoxLimitY2 = Options.cropViewHeight;

	$(cutBox).css({
		"display": "block",
		"width": Options.cutViewWidth + "px",
		"height": Options.cutViewHeight + "px",
		"left": Options.cutLeft + "px",
		"top": Options.cutTop + "px",
	});
	$(img_preview).css({
		"width": Options.cropViewWidth + "px",
		"height": Options.cropViewHeight + "px"
	});
	$(mainCutter).css({
		"display": "block",
		"width": Options.cropViewWidth + "px",
		"height": Options.cropViewHeight + "px",
		"left": Options.cropLeft + "px",
		"top": Options.cropTop + "px"
	});

	Options.initStatus = true;
	Options_process.initStatus = true;
	Options_process.percent = 100;
	Options_process.pointX = Options_process.barWidth;
	_resizeProcessBar();
}

//--添加缩放功能。  
Options_zoom = {
	beginX1: 0,
	beginY1: 0,
	beginX2: 0,
	beginY2: 0,
	endX1: 0,
	endY1: 0,
	endX2: 0,
	endY2: 0
};
//--添加裁剪框移动功能  
Options_move = {
	beginX1: 0,
	beginY1: 0,
	endX1: 0,
	endY1: 0
};

/** 
 * 拖动裁剪框的逻辑处理。 
 * */
cutBox.addEventListener("touchstart", function(event) {
	event.preventDefault();
	event.stopPropagation();
	Options_move = {
		beginX1: 0,
		beginY1: 0,
		endX1: 0,
		endY1: 0
	};
	var beginX = event.changedTouches[0].pageX;
	var beginY = event.changedTouches[0].pageY;
	Options_move.beginX1 = beginX;
	Options_move.beginY1 = beginY;

}, false);
cutBox.addEventListener("touchmove", function(event) {
	event.preventDefault();
	event.stopPropagation();
	//--  
	var beginX = event.changedTouches[0].pageX;
	var beginY = event.changedTouches[0].pageY;
	Options_move.endX1 = beginX;
	Options_move.endY1 = beginY;
	//--计算是否发生位移，根据位移来定位裁剪框位置。  
	//位移量。  
	var _d_x = Options_move.endX1 - Options_move.beginX1;
	var _d_y = Options_move.endY1 - Options_move.beginY1;
	//--当前裁剪框原始位置。  
	var _new_x = Options.cutLeft;
	var _new_y = Options.cutTop;
	_new_x += _d_x;
	_new_y += _d_y;
	//--判断是否在矩形边框，假如超出去，那么就取最终点。  
	//--注意，判断相关点的范围。  

	if(_new_x < Options.cutBoxLimitX1) {
		_new_x = Options.cutBoxLimitX1;
	} else if(_new_x > Options.cutBoxLimitX2) {
		_new_x = Options.cutBoxLimitX2;
	}
	//--顺便判断，加上宽度后，是否超过了范围。  
	if((_new_x + Options.cutViewWidth) > Options.cutBoxLimitX2) {
		_new_x = Options.cutBoxLimitX2 - Options.cutViewWidth;
	}
	if(_new_y < Options.cutBoxLimitY1) {
		_new_y = Options.cutBoxLimitY1;
	} else if(_new_y > Options.cutBoxLimitY2) {
		_new_y = Options.cutBoxLimitY2;
	}
	//--顺便判断，加上裁剪框高度后，是否超过下限。  
	if((_new_y + Options.cutViewHeight) > Options.cutBoxLimitY2) {
		_new_y = Options.cutBoxLimitY2 - Options.cutViewHeight;
	}

	Options.cutLeft = _new_x;
	Options.cutTop = _new_y;
	_resizeCutBox();
	//---将这一点的放回前一点。  
	Options_move.beginX1 = Options_move.endX1;
	Options_move.beginY1 = Options_move.endY1;

}, false);
cutBox.addEventListener("touchend", function(event) {
	event.preventDefault();
	event.stopPropagation();
	return;

}, false);
/** 
 * 根据相关参数重新resize裁剪框 
 * */
function _resizeCutBox() {
	$(cutBox).css({
		"width": Options.cutViewWidth + "px",
		"height": Options.cutViewHeight + "px",
		"left": Options.cutLeft + "px",
		"top": Options.cutTop + "px"
	});
}

function _getCutImageData() {
	var output = document.createElement("canvas");
	//--坐标换算。  
	var scale_x = Options_image.width / Options.cropViewWidth;
	var scale_y = Options_image.height / Options.cropViewHeight;
	var _o_x = parseInt((scale_x) * Options.cutLeft);
	var _o_y = parseInt((scale_y) * Options.cutTop);
	//--长度换算  
	var _o_width = parseInt(scale_x * Options.cutViewWidth);
	var _o_height = parseInt(scale_y * Options.cutViewHeight);

	output.width = Options.cutWidth;
	output.height = Options.cutHeight;
	output.getContext("2d").drawImage(img_preview, _o_x, _o_y, _o_width, _o_height, 0, 0, output.width, output.height);
	return output.toDataURL("image/jpeg");
}

/** 
 * processBar 进度条相关操作。 
 * */

Options_process = {
	beginX: 0, //触摸时候起始点  
	beginY: 0, //触摸时候起始点  
	endX: 0, //触摸时候终点  
	endY: 0, //触摸时候终点  
	barWidth: 200, //进度条长度  
	pointX: 0, //当前指示点位置  
	pointY: 0,
	percent: 0, //百分比值。  
	initStatus: false
};
var processBar = document.getElementById("processBar");
var processPoint = document.getElementById("processPoint");

//--添加触屏事件，监控相关动作。  
//开始触摸  
processBar.addEventListener("touchstart", function(event) {
	event.preventDefault();
	event.stopPropagation();

	if(!Options_process.initStatus) {
		return;
	}
	var beginX = event.changedTouches[0].pageX;
	var beginY = event.changedTouches[0].pageY;
	Options_process.beginX = beginX;
	Options_process.beginY = beginY;
}, false);
//--移动中  
processBar.addEventListener("touchmove", function(event) {
	event.preventDefault();
	event.stopPropagation();

	if(!Options_process.initStatus) {
		return;
	}
	var beginX = event.changedTouches[0].pageX;
	var beginY = event.changedTouches[0].pageY;
	Options_process.endX = beginX;
	Options_process.endY = beginY;
	//--计算比分比。  
	var _d_x = Options_process.endX - Options_process.beginX;
	Options_process.percent += parseInt(_d_x * 100 / Options_process.barWidth);
	if(Options_process.percent < 0) {
		Options_process.percent = 0;
	} else if(Options_process.percent > 100) {
		Options_process.percent = 100;
	}
	//--计算那个指示点位置。  
	Options_process.pointX = parseInt(Options_process.barWidth * (Options_process.percent / 100));
	_resizeProcessBar();
	//--根据百分比，设置裁剪框大小。  
	var _o_cut_x = Options.cutLeft;
	var _o_cut_y = Options.cutTop;
	var _o_cut_width = Options.cutViewWidth;
	var _new_cut_width = parseInt(Options.cutMaxWidth * (Options_process.percent / 100));
	var _new_cut_height = parseInt(Options.cutMaxHeight * (Options_process.percent / 100));
	if(_new_cut_width > _o_cut_width) {
		//--扩大了。  
		//--计算当前坐标  
		var _d_x_2 = _new_cut_width - Options.cutViewWidth;
		var _d_y_2 = _new_cut_height - Options.cutViewHeight;

		Options.cutLeft = Options.cutLeft - parseInt(_d_x_2 / 2);
		Options.cutTop = Options.cutTop - parseInt(_d_y_2 / 2);
		Options.cutViewWidth = _new_cut_width;
		Options.cutViewHeight = _new_cut_height;
		_resizeCutBox();

	} else if(_new_cut_width < _o_cut_width) {
		//--缩小了。  
		var _d_x_2 = Options.cutViewWidth - _new_cut_width;
		var _d_y_2 = Options.cutViewHeight - _new_cut_height;
		Options.cutLeft = Options.cutLeft + parseInt(_d_x_2 / 2);
		Options.cutTop = Options.cutTop + parseInt(_d_y_2 / 2);
		Options.cutViewWidth = _new_cut_width;
		Options.cutViewHeight = _new_cut_height;
		_resizeCutBox();

	}

	//--后续处理。  
	Options_process.beginX = Options_process.endX;
	Options_process.endY = Options_process.endY;

}, false);
//--结束  
processBar.addEventListener("touchend", function(event) {
	event.preventDefault();
	event.stopPropagation();

	if(!Options_process.initStatus) {
		return;
	}
}, false);
/** 
 * 根据相关属性，重设slider位置。 
 * */
function _resizeProcessBar() {
	$(processPoint).css("left", Options_process.pointX + "px");
}

