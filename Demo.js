import * as THREE from 'three/webgpu';
import { GridPristine } from '@three-blocks/core';
import { component, updateComponentRegistry } from '@/offscreen/dispatcher';
import { scene } from '@/offscreen/main';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { store } from '@/offscreen/store';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Demo extends component( THREE.Object3D, {
	raf: {
		renderPriority: 1,
		fps: Number.Infinity,
	},
} ) {

	init() {

		//model
		const loader = new GLTFLoader();

		loader.load('/assets/subsurfHD.glb', (glb)=>{
			console.log(glb)
			// this.file = new THREE.Mesh(geometry, material );
			// this.file.scale = (100,100,100);
			this.add(glb.scene);
		})

		// Cube
		// const geometry = new THREE.BoxGeometry( 2, 2, 2 );
		// const material = new THREE.MeshPhysicalNodeMaterial( {
		// 	color: 0x4488ff,
		// 	metalness: 0.3,
		// 	roughness: 0.4,
		// } );
		// this.cube = new THREE.Mesh( geometry, material );
		// this.cube.position.y = 1.5;
		// this.cube.castShadow = true;
		// this.add( this.cube );

		// Grid
		this.grid = new GridPristine();
		this.grid.position.y = 0;
		this.add( this.grid );

		// Lighting
		const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
		dirLight.position.set( 5, 10, 5 );
		dirLight.castShadow = true;
		this.add( dirLight );

		const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
		this.add( ambientLight );

		scene.add( this );

		// Environment
		this.setupEnvironment();

	}

	setupEnvironment() {

		const environment = new RoomEnvironment();
		const pmremGenerator = new THREE.PMREMGenerator( store.gl );
		scene.environment = pmremGenerator.fromScene( environment ).texture;
		scene.environmentIntensity = 0.5;
		pmremGenerator.dispose();
		scene.background = new THREE.Color( 0x1a1a2e );

	}

	// onRaf( { delta } ) {

	// 	// Slow rotation
	// 	this.cube.rotation.x += delta * 0.3;
	// 	this.cube.rotation.y += delta * 0.5;

	// }

	onResize() {}

	dispose() {

		super.dispose();

	}

}

// HMR support
if ( import.meta.hot ) {

	import.meta.hot.accept( ( newModule ) => {

		updateComponentRegistry( 'Demo', newModule );

	} );

}
