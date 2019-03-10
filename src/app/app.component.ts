import {Component, ViewChild, ElementRef, OnInit, AfterViewInit} from '@angular/core';
import THREE from './js/three';
var Physijs = require('physijs-webpack');

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
    /**
     * hacer una surface ondulada donde las gotas de agua van de agujero en agujero
     * el usuario puede mover el plano y hacer mover las gotas de agua entre los agujeros de la surface
     */
    @ViewChild('rendererContainer') rendererContainer: ElementRef;

    renderer = new THREE.WebGLRenderer();
    scene = null;
    camera = null;
    plane = null;
    waterDrop = null;
    controls: THREE.OrbitControls;

    customUniforms;
    customUniforms2;

    clock = new THREE.Clock();

    manager;
    loaderTextures;

    ngOnInit() {

    }

// FUNCTIONS
constructor() {

    this.defineLoadTextures();

	// SCENE
    this.scene = new THREE.Scene();
    
    // CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	this.scene.add(this.camera);
	this.camera.position.set(0,100,400);
	this.camera.lookAt(this.scene.position);	
    
    // RENDERER
    this.renderer = new THREE.WebGLRenderer( {antialias:true} );
    this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	// CONTROLS
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

    // LIGHT
	this.defineLights();

	// FLOOR
	this.defineFloor();
    
    // SKYBOX/FOG
    this.scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
    
    // ondulate mesh
    this.defineOndulateMesh();

    // water
    this.defineWater();
	
	////////////
	// CUSTOM //
	////////////
    //this.defineShaderPlanes();
}

defineLoadTextures() {
    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = function ( item, loaded, total ) {
        console.log( item, loaded, total );
    };
    this.loaderTextures = new THREE.TextureLoader( this.manager );
}

defineLights() {
    var light1 = new THREE.PointLight(0xffffff);
    light1.position.set(0,250,0);
    this.scene.add(light1);

    var light = new THREE.DirectionalLight( 0xffffff, 0.8 );
    light.position.set( - 1000, 1000, 1000 );
    
    light.castShadow = true;
    light.shadow.camera.visible = true;

    light.shadow.camera.top = 200;
    light.shadow.camera.right = 200;
    light.shadow.camera.left = -200
    light.shadow.camera.bottom = -200;

    light.shadow.camera.near = 1;
    light.shadow.camera.far = 20000;

    this.scene.add( light );

    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );

    this.scene.add( ambientLight );
}

defineFloor() {

    var floorTexture = this.loaderTextures.load( 'assets/textures/checkerboard.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
    //var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    // Materials
    var floorMaterial = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: floorTexture }),
        .8, // high friction
        .4 // low restitution
    );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    
    // Ground
    floor = new Physijs.BoxMesh(
        new THREE.BoxGeometry(50, 1, 50),
        //new THREE.PlaneGeometry(50, 50),
        floorMaterial,
        0 // mass
    );
    floor.receiveShadow = true;

	this.scene.add(floor);
}

defineShaderPlanes() {
    var noiseTexture = this.loaderTextures.load( 'assets/textures/cloud.png' );
	noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
		
	var lavaTexture = this.loaderTextures.load( 'assets/textures/lava.jpg' );
	lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping; 
	
	// use "this." to create global object
	this.customUniforms = {
		baseTexture: 	{ type: "t", value: lavaTexture },
		baseSpeed: 		{ type: "f", value: 0.05 },
		noiseTexture: 	{ type: "t", value: noiseTexture },
		noiseScale:		{ type: "f", value: 0.5337 },
		alpha: 			{ type: "f", value: 1.0 },
		time: 			{ type: "f", value: 1.0 }
	};
	
	// create custom material from the shader code above
	//   that is within specially labeled script tags
	var customMaterial = new THREE.ShaderMaterial( 
	{
	    uniforms: this.customUniforms,
		vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent
	}   );
	// other material properties
	customMaterial.side = THREE.DoubleSide;
	// apply the material to a surface
	var flatGeometry = new THREE.PlaneGeometry( 100, 100 );
    var surface = new THREE.Mesh( flatGeometry, customMaterial );
	surface.position.set(-60,50,150);
	this.scene.add( surface );
	
	/////////////////////////////////
	// again, but for water!
	
	var waterTexture = this.loaderTextures.load( 'assets/textures/water.jpg' );
	waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping; 
	
	// use "this." to create global object
	this.customUniforms2 = {
		baseTexture: 	{ type: "t", value: waterTexture },
		baseSpeed: 		{ type: "f", value: 1.15 },
		noiseTexture: 	{ type: "t", value: noiseTexture },
		noiseScale:		{ type: "f", value: 0.2 },
		alpha: 			{ type: "f", value: 0.8 },
		time: 			{ type: "f", value: 1.0 }
	};
	// create custom material from the shader code above
	//   that is within specially labeled script tags
	var customMaterial2 = new THREE.ShaderMaterial( 
	{
	    uniforms: this.customUniforms2,
		vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent
	}   );
 
	// other material properties
	customMaterial2.side = THREE.DoubleSide;
	customMaterial2.transparent = true;
	
	// apply the material to a surface
	var flatGeometry = new THREE.PlaneGeometry( 100, 100 );
    var surface = new THREE.Mesh( flatGeometry, customMaterial2 );
	surface.position.set(60,50,150);
    this.scene.add( surface );
}

physics;

defineWater() {
    var noiseTexture = this.loaderTextures.load( 'assets/textures/cloud.png' );
	noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
	
	var waterTexture = this.loaderTextures.load( 'assets/textures/water.jpg' );
	waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping; 
	
	// use "this." to create global object
	this.customUniforms2 = {
		baseTexture: 	{ type: "t", value: waterTexture },
		baseSpeed: 		{ type: "f", value: 1.15 },
		noiseTexture: 	{ type: "t", value: noiseTexture },
		noiseScale:		{ type: "f", value: 0.2 },
		alpha: 			{ type: "f", value: 0.8 },
		time: 			{ type: "f", value: 1.0 }
	};
	// create custom material from the shader code above
	//   that is within specially labeled script tags
	var customMaterial2 = new THREE.ShaderMaterial( 
	{
	    uniforms: this.customUniforms2,
		vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent
	}   );
 
	// other material properties
	customMaterial2.side = THREE.DoubleSide;
	customMaterial2.transparent = true;
	
	// apply the material to a surface
	var flatGeometry = new THREE.SphereGeometry( 30, 30, 30 );
    var surface = new THREE.Mesh( flatGeometry, customMaterial2 );
    surface.position.set(60,50,150);

    //this.physics = new THREE.MMDPhysics( surface );

    this.scene.add( surface );
}

defineOndulateMesh() {

    var textureTerrain = this.loaderTextures.load( 'assets/textures/686.jpg' );
    var materialTerrain = new THREE.MeshLambertMaterial({ map: textureTerrain, side: THREE.DoubleSide });

    //var material = new THREE.MeshBasicMaterial({color:0xb67df0});
    var geo = new THREE.Geometry();

    var width = 300;
    var height = 300;
    var period = 20;

    for (var i=0;i<width;i++){
        for (var j=0;j<height;j++){
            if (i<width-1 && j<height-1){
            var index = i*height + j;
            geo.faces.push(new THREE.Face3(index, index+height, index+1));
            geo.faces.push(new THREE.Face3(index+1, index+height, index+height+1));
            }
            geo.vertices.push(new THREE.Vector3(i, j,
                Math.sin(Math.PI*2*i/period)+Math.sin(Math.PI*2*j/period)));
        }
    }
    geo.computeVertexNormals();
    geo.center();

    //wireframe
    var wireframeGeo = new THREE.WireframeGeometry(geo);
    var wireframeMaterial = new THREE.LineBasicMaterial({color:0x000000, linewidth:2});
    var wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);


    var mesh = new THREE.Mesh(geo, materialTerrain);
    this.scene.add(mesh);
    //this.scene.add(wireframe);
}
animate() 
{
    window.requestAnimationFrame(() => this.animate());
	this.render();		
	this.update();
}
update()
{
    /*
	if ( keyboard.pressed("z") ) 
	{ 
		// do something
    }
    */
	var delta = this.clock.getDelta();
	//this.customUniforms.time.value += delta;
	this.customUniforms2.time.value += delta;
	this.controls.update();
	//this.stats.update();
}
render() 
{
	this.renderer.render( this.scene, this.camera );
}

ngAfterViewInit() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    //this.renderer.shadowMap.enabled = false;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.animate();
}


/*

    constructor() {
        this.createManagements();

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.set(0,100,400);
	    this.camera.lookAt(this.scene.position);	

        // SKYBOX/FOG
	    this.scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );

        this.createLights();

        this.initOptionsEvents();

        //this.getVertexShader();
        //this.getFragmentShader();

        //this.defineOndulateMesh();

        const geometryPlane = new THREE.PlaneBufferGeometry(300, 300, 30, 30);
        const geometrySphere = new THREE.SphereGeometry(10, 64, 64);
        this.waterDrop = new THREE.Water(geometrySphere);
        const material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
        this.plane = new THREE.Mesh(geometryPlane, material);

        //this.scene.add(this.plane);
        this.scene.add(this.waterDrop);
    }

    defineShaders() {
        debugger;
        var noiseTexture = new THREE.ImageUtils.loadTexture( './assets/textures/cloud.png' );
        noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
    
        var waterTexture = new THREE.ImageUtils.loadTexture( './assets/textures/water.jpg' );
        waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping; 
        
        // use "this." to create global object
        this.customUniforms2 = {
            baseTexture: 	{ type: "t", value: waterTexture },
            baseSpeed: 		{ type: "f", value: 1.15 },
            noiseTexture: 	{ type: "t", value: noiseTexture },
            noiseScale:		{ type: "f", value: 0.2 },
            alpha: 			{ type: "f", value: 0.8 },
            time: 			{ type: "f", value: 1.0 }
        };

        // create custom material from the shader code above
        //   that is within specially labeled script tags
        var customMaterial2 = new THREE.ShaderMaterial( 
        {
            uniforms: this.customUniforms2,
            vertexShader: document.getElementById( 'vertexShader' ).textContent,
	        fragmentShader: document.getElementById( 'fragmentShader' ).textContent
        });
    
        // other material properties
        customMaterial2.side = THREE.DoubleSide;
        customMaterial2.transparent = true;
        
        // apply the material to a surface
        var flatGeometry = new THREE.PlaneGeometry( 100, 100 );
        var surface = new THREE.Mesh( flatGeometry, customMaterial2 );
        surface.position.set(60,50,150);
        this.scene.add( surface );
    }

    private createLights() {

        // LIGHT
        var light = new THREE.PointLight(0xffffff);
        light.position.set(0,250,0);
        this.scene.add(light);
        
        var light = new THREE.DirectionalLight( 0xffffff, 0.8 );
        light.position.set( - 1000, 1000, 1000 );
        
        light.castShadow = true;
        light.shadow.camera.visible = true;

        light.shadow.camera.top = 200;
        light.shadow.camera.right = 200;
        light.shadow.camera.left = -200
        light.shadow.camera.bottom = -200;

        light.shadow.camera.near = 1;
        light.shadow.camera.far = 20000;

        this.scene.add( light );

        var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );

        this.scene.add( ambientLight );
    }

    private manager: THREE.LoadingManager;
    private loaderTextures: THREE.TextureLoader;

    private createManagements() {

        this.manager = new THREE.LoadingManager();
        this.manager.onProgress = function ( item, loaded, total ) {
            console.log( item, loaded, total );
        };
        this.loaderTextures = new THREE.TextureLoader( this.manager );
    }

    defineOndulateMesh() {

        var textureTerrain = this.loaderTextures.load( 'assets/textures/686.jpg' );
        var materialTerrain = new THREE.MeshLambertMaterial({map: textureTerrain, needsUpdate: true});

        //var material = new THREE.MeshBasicMaterial({color:0xb67df0});
        var geo = new THREE.Geometry();

        var width = 300;
        var height = 300;
        var period = 20;

        for (var i=0;i<width;i++){
            for (var j=0;j<height;j++){
                if (i<width-1 && j<height-1){
                var index = i*height + j;
                geo.faces.push(new THREE.Face3(index, index+height, index+1));
                geo.faces.push(new THREE.Face3(index+1, index+height, index+height+1));
                }
                geo.vertices.push(new THREE.Vector3(i, j,
                    Math.sin(Math.PI*2*i/period)+Math.sin(Math.PI*2*j/period)));
            }
        }
        geo.computeVertexNormals();
        geo.center();

        //wireframe
        var wireframeGeo = new THREE.WireframeGeometry(geo);
        var wireframeMaterial = new THREE.LineBasicMaterial({color:0x000000, linewidth:2});
        var wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);


        var mesh = new THREE.Mesh(geo, materialTerrain);
        this.scene.add(mesh);
        //this.scene.add(wireframe);
    }

    private initOptionsEvents() {
      this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
      //this.controls.maxPolarAngle = Math.PI * 0.495;
      //this.controls.target.set( 0, 0, 0 );
      //this.controls.enablePan = true;
      //this.controls.minDistance = 40.0;
      //this.controls.maxDistance = 200.0;
    }

    ngOnInit() {
        this.defineShaders();
    }

    ngAfterViewInit() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

        this.animate();
    }

    animate() {
        window.requestAnimationFrame(() => this.animate());
        //this.mesh.rotation.x += 0.01;
        //this.mesh.rotation.y += 0.02;
        var delta = this.clock.getDelta();
        this.customUniforms2.time.value += delta;

        this.renderer.render(this.scene, this.camera);
    }
    */
}