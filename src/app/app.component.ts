import {Component, ViewChild, ElementRef} from '@angular/core';
import THREE from './js/three';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
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

    matShader: THREE.MeshPhongMaterial;

    constructor() {
        this.createManagements();

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.z = 20;
        this.camera.position.y = -100;

        this.createLights();

        this.initOptionsEvents();

        this.defineMatShader();

        this.defineOndulateMesh();

        const geometryPlane = new THREE.PlaneBufferGeometry(300, 300, 30, 30);
        const geometrySphere = new THREE.SphereGeometry(10, 64, 64);
        this.waterDrop = new THREE.Water(geometrySphere, this.matShader);
        const material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
        this.plane = new THREE.Mesh(geometryPlane, material);

        //this.scene.add(this.plane);
        this.scene.add(this.waterDrop);
    }

    private createLights() {
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

    defineMatShader() {
        const mat = new THREE.MeshPhongMaterial({color:0x2288ff, shininess:100,})

        mat.onBeforeCompile = (shader) => {
            shader.uniforms.time = { value: 0}
            shader.vertexShader = `
                uniform float time;
            ` + shader.vertexShader

            const token = '#include <begin_vertex>'
            const customTransform = `
                vec3 transformed = vec3(position);
                float freq = 3.0;
                float amp = 0.1;
                float angle = (time + position.x)*freq;
                transformed.z += sin(angle)*amp;
            `
            shader.vertexShader = shader.vertexShader.replace(token,customTransform)
            this.matShader = shader
        }
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
      this.controls.enablePan = true;
      this.controls.minDistance = 40.0;
      this.controls.maxDistance = 200.0;
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
        this.renderer.render(this.scene, this.camera);
    }
}