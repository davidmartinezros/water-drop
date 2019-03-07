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

    constructor() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.z = 100;
        this.camera.position.y = -100;

        this.initOptionsEvents();

        const geometryPlane = new THREE.PlaneBufferGeometry(300, 300, 30, 30);
        const geometrySphere = new THREE.SphereGeometry(10, 64, 64);
        this.waterDrop = new THREE.Water(geometrySphere);
        const material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
        this.plane = new THREE.Mesh(geometryPlane, material);

        this.scene.add(this.plane);
        this.scene.add(this.waterDrop);
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