var appimg = (function() {
	var $ = this;
	/*
	 	上传照片功能
		使用方法 
		app.getPhoto(function(imageData){
			document.querySelector('#box').src=imageData;
		},true);
		参数：callback 回调方法
		参数：compress 是否压缩，默认为压缩
	*/
	$.getPhoto = function(callback, compress) {
		compress = compress ? compress : true;
		var btns = [{
			title: "拍照"
		}, {
			title: "从相册选择"
		}];
		plus.nativeUI.actionSheet({
			cancel: "取消",
			buttons: btns
		}, function(btn) {
			switch(btn.index) {
				case 1:
					cameraImage();
					break;
				case 2:
					galleryImg();
					break;
				default:
					break;
			}
		});

		function cameraImage() { //相机
			plus.camera.getCamera().captureImage(function(e) {
				plus.io.resolveLocalFileSystemURL(e, function(entry) {
					console.log(entry.toLocalURL());
					var obj = entry.toLocalURL();
					appendFile(obj, 1);
				}, function(e) {
					console.log("读取拍照文件错误：" + e.message);
				});
			}, function(e) {}, {
				filename: ""
			});
		}

		function galleryImg() { //相册
			plus.gallery.pick(function(e) {
				console.log(e);
				plus.io.resolveLocalFileSystemURL(e, function(entry) {
					var obj = entry.fullPath;
					appendFile(obj, 2); //处理图片的地方
				}, function(e) {
					console.log("读取拍照文件错误：" + e.message);
				});
			}, function(e) {}, {
				filter: "image"
			})
		};

		function appendFile(path, imgType) {
			var waiting = plus.nativeUI.showWaiting("图片处理中");
			var img = new Image();
			img.src = path;
			img.onload = function() {
				var that = this;
				var w = that.width,
					h = that.height;
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');

				canvas.setAttribute('width', w);
				canvas.setAttribute('height', h);
				ctx.drawImage(that, 0, 0, w, h);
				var base64 = canvas.toDataURL('image/jpeg', 0.5 || 0.3); //1最清晰，越低越模糊。
				plus.nativeUI.closeWaiting(waiting);
				callback(base64);
			}
		};

	}

	return $;
})();