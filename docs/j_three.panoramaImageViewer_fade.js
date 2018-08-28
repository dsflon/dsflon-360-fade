function jThreePanoramaImageViewer(imageElm,imageSrc) {

    this.imageUA = navigator.userAgent;
    this.imageIOS = false;
    this.imageSP = false;

    if(/(iPhone|iPod|iPad)/.test(this.imageUA)) {
        this.imageIOS = true;
    }
    if(/(iPhone|iPod|iPad|Android)/.test(this.imageUA)) {
        this.imageSP = true;
    }

    this.speed = 8;

    this.onload = false;
    this.loadEnd = function(){};

    this.image = {};
    this.imageElm = imageElm;
    this.imageSrc = imageSrc;
    this.imageSrcLength = imageSrc.length;
    this.imageWidth = window.innerWidth;
    this.imageHeight = window.innerHeight;

    //
    this.container,
    this.scene,
    this.renderer,
    this.camera,
    this.animateFrame,
    this.animate,
    this.imageTexture = {},
    this.screen = {};

    //
    this.controls;
    this.autoRotate = false;
    this.enablePan = false;
    this.autoRotateSpeed = 1;
    this.minDistance = 1;
    this.maxDistance = 6;
    this.enableZoom = true;
    this.zoomSpeed = 10;
    this.rotateSpeed = 1;
    this.deviceOrientationControls = false;

    //
    this.mouseX = 0;
    this.mouseY = 0;

    //
    this.initCamera();
    this.ImageInit();

    var that = this;


    var imageloadCount = 0;
    for (var i = 0; i < this.imageSrcLength; i++) {
        this.image[i].onload = function(){
            imageloadCount++
        };
    }

    var onload = setInterval(function(){
        if( imageloadCount > that.imageSrcLength - 1 ) {
            that.loadEnd();
            clearInterval(onload);
        }

    },1);

}

////

jThreePanoramaImageViewer.prototype.ImageInit = function() {

    for (var i = 0; i < this.imageSrcLength; i++) {
        this.image[i] = new Image();
        this.image[i].src = this.imageSrc[i];
    }

}

////

jThreePanoramaImageViewer.prototype.initThree = function() {

    this.container = document.createElement( 'div' );
    this.imageElm.appendChild( this.container );

    this.scene = new THREE.Scene();
	// this.group = new THREE.Group();

    this.renderer = new THREE.WebGLRenderer( {
        antialias:true,
        alpha: true
    } );
    this.renderer.setSize( this.imageWidth, this.imageHeight );
    this.renderer.setClearColor("#FFFFFF", 0);
    this.container.appendChild( this.renderer.domElement );

    if( this.deviceOrientationControls ){
        if (this.imageSP) {
            this.controls = new THREE.DeviceOrientationControls(this.camera,this.renderer.domElement);
        } else {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        }

    } else {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }

    var that = this;
    window.addEventListener( 'resize', function() {
        var winHeight = window.innerHeight;
        var winWidth = window.innerWidth;
        if( Math.abs(that.imageHeight - winHeight) > 100 ) {
            that.imageHeight = window.innerHeight;
            that.onWindowResize(that);
        }
        if( Math.abs(that.imageWidth - winWidth) > 1 ) {
            that.imageWidth = window.innerWidth;
            that.onWindowResize(that);
        }
    }, false );

}

////

jThreePanoramaImageViewer.prototype.initCamera = function() {

    this.camera = new THREE.PerspectiveCamera(75, this.imageWidth / this.imageHeight, 1, 1000);
    this.camera.position.set(0,0,4);


}

////

jThreePanoramaImageViewer.prototype.initObject = function() {

    var geometry = new THREE.SphereGeometry( 5, 60, 40 );
        geometry.scale( - 1, 1, 1 );
    var material = {}

    for (var i = 0; i < this.imageSrcLength; i++) {
        this.imageTexture[i] = new THREE.TextureLoader().load( this.imageSrc[i] );
        material[i] = new THREE.MeshBasicMaterial({
            map : this.imageTexture[i],
            transparent: true
        });
        this.screen[i] = new THREE.Mesh( geometry, material[i] );
        this.screen[i].rotation.set(0,-Math.PI/2,0);
        this.scene.add( this.screen[i] );
    }

}


jThreePanoramaImageViewer.prototype.onWindowResize = function(that) {

    that.camera.aspect = window.innerWidth / window.innerHeight;
    that.camera.updateProjectionMatrix();

    that.renderer.setSize( window.innerWidth, window.innerHeight );

}

////

jThreePanoramaImageViewer.prototype.play = function() {

    this.initThree();
    this.initObject();

    if (!this.deviceOrientationControls) {
        this.controls.minDistance = this.minDistance;
        this.controls.maxDistance = this.maxDistance;
        this.controls.enableZoom = this.enableZoom;
        this.controls.zoomSpeed = this.zoomSpeed;
        this.controls.autoRotate = this.autoRotate;
        this.controls.autoRotateSpeed = this.autoRotateSpeed;
        this.controls.rotateSpeed = this.rotateSpeed;
        this.controls.enablePan = this.enablePan;
    }

    this.render();
    this.playing = true;
    this.muting = true;
}


jThreePanoramaImageViewer.prototype.start = function() {

    if(this.autoRotate) this.controls.autoRotate = true;
    this.playing = true;

}

jThreePanoramaImageViewer.prototype.stop = function() {

    if(this.autoRotate) this.controls.autoRotate = false;
    this.playing = false;

}

jThreePanoramaImageViewer.prototype.pause = function() {

    if(this.autoRotate) this.controls.autoRotate = false;
    this.playing = false;

}

////

jThreePanoramaImageViewer.prototype.stopToggle = function() {
    this.playing ? this.stop() : this.start();
};
jThreePanoramaImageViewer.prototype.pauseToggle = function() {
    this.playing ? this.pause() : this.start();
};

////

jThreePanoramaImageViewer.prototype.render = function() {

    var speed = 1 / this.speed;
    var frameLength = this.imageSrcLength;
    var startTime = new Date().getTime();
    var that = this;

    var prevFrame;
    var opacity = 0;

    // that.screen[0].rotation.x = 50;
    // that.screen[1].rotation.x = 50;
    // that.screen[2].rotation.x = 50;
    this.camera.position.y = 0.5;

    this.animate = function () {

        var currentTime = new Date().getTime();
        var frame = Math.floor( ( currentTime - startTime ) / ( 1000 / speed ) % frameLength );

        if( prevFrame != frame ) {
            prevFrame = frame;
            opacity = 0;
        }
        opacity += 0.02;

        for (var i = 0; i < that.imageSrcLength; i++) {

            if ( i == frame ) {
                that.screen[frame].material.opacity = opacity;
                that.screen[frame].scale.x = 0.999;
                that.screen[frame].scale.y = 0.999;
                that.screen[frame].scale.z = 0.999;
                // that.screen[frame].position.z = 0.002;
            } else {
                that.screen[i].material.opacity = 1;
                that.screen[i].scale.x = 1;
                that.screen[i].scale.y = 1;
                that.screen[i].scale.z = 1;
                // that.screen[i].position.z = 0;
            }

        }

        ////

        that.animateFrame = requestAnimationFrame( that.animate );
        that.renderer.render( that.scene, that.camera );

        ////

        if( that.deviceOrientationControls ){

            if (this.imageSP) {
                that.controls.connect();
                that.controls.update();
            } else {
                that.controls.update();
            }
        } else {
            that.controls.update();
        }

    }
    this.animate();

}
