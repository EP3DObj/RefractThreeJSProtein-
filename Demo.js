import * as THREE from 'three/webgpu';
import { GridPristine } from '@three-blocks/core';
import { component, updateComponentRegistry } from '@/offscreen/dispatcher';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from '@/offscreen/main';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { store } from '@/offscreen/store';
import { add, clamp, dot, float, mix, mul, normalWorld, pow, texture, uniform, uv, vec3, vertexColor, normalize, positionWorld } from 'three/tsl';



export class Demo extends component( THREE.Object3D, {
    raf: {
        renderPriority: 1,
        fps: Number.Infinity,
    },
} ) {
	

    init () {

		const lightPivot = new THREE.Object3D();
		lightPivot.position.set( 0, 0, 0 );
		// lightPivot.rotation.set( 0, 15, 0);
		scene.add( lightPivot );

		const keyDirectionalLight = new THREE.DirectionalLight( 0xcbe6f9, .75 );
		keyDirectionalLight.position.set( 0.0, .5, 0.5 ).normalize(); 
		scene.add( keyDirectionalLight );

		const pointLight1 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xcbe6f9 } ) );
		pointLight1.add( new THREE.PointLight( 0xcbe6f9, 100, 150, 0 ) );
		this._pointLight1 = pointLight1;
		lightPivot.add( pointLight1 );
		pointLight1.position.set( 0, -50, 350 );

		const pointLight2 = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xffc964 } ) );
		pointLight2.add( new THREE.PointLight( 0xffc964, 105, 165, 0  ) );
		this._pointLight2 = pointLight2;
		lightPivot.add( pointLight2 );
		pointLight2.position.set( 0, -50, -170 );

		this._lightPivot = lightPivot;

		this._clock = new THREE.Clock();

		this._keyDirectionalLight = keyDirectionalLight;
		this._keyLightWorldPos = new THREE.Vector3();
		this._keyTargetWorldPos = new THREE.Vector3();

		this._sssLightWorldPosition = uniform( new THREE.Vector3( 4, 4, 4 ) );
		this._sssKeyLightToward = uniform( new THREE.Vector3( 0, 1, 0 ) );


	//GLB + SSS-style transmissive material
	const thicknessLoader = new THREE.ImageBitmapLoader();
	thicknessLoader.load( '/assets/ThickMap.png', ( bitmap ) => {

    const thicknessTex = new THREE.Texture( bitmap );
    thicknessTex.flipY = false;
    thicknessTex.colorSpace = THREE.NoColorSpace;
    thicknessTex.needsUpdate = true;

	const thicknessNode = texture( thicknessTex, uv() ).r;

	const pointToLightRay = normalize( this._sssLightWorldPosition.sub( positionWorld ) );
	const pointBackLightNode = pow(
		clamp( dot( normalWorld, pointToLightRay ), float( 0 ), float( 1 ) ),
		float( 5 )
	);

	const keyBackLightNode = pow(
		clamp( dot( normalWorld, this._sssKeyLightToward ), float( 0 ), float( 1 ) ),
		float( 5 )
	);

	const sssStrengthNode = float( .25 );
	const keyFakeSssBoost = float( 2.5 );

	const baseVertexColorNode = vertexColor().rgb;
	const vertexColorLumaNode = dot( baseVertexColorNode, vec3( 0.2126, 0.7152, 0.0722 ) );
	const saturatedVertexColorNode = mix(
		vec3( vertexColorLumaNode, vertexColorLumaNode, vertexColorLumaNode ),
		baseVertexColorNode,
		float( 1.5 )
	);
	const brightVertexColorNode = mul( saturatedVertexColorNode, float( 1.6 ) );
	const sssColorNode = clamp( brightVertexColorNode, float( 0 ), float( 1 ) );

	const fakeSssFromPoint = mul( mul( mul( sssColorNode, thicknessNode ), pointBackLightNode ), sssStrengthNode );
	const fakeSssFromKey = mul(
		mul( mul( sssColorNode, thicknessNode ), keyBackLightNode ),
		mul( sssStrengthNode, keyFakeSssBoost )
	);

    const sssMaterial = new THREE.MeshPhysicalNodeMaterial( {
		color: 0xffffff,
		vertexColors: true,
        transmission: 1,
        thickness: 0.15,
        thicknessMap: thicknessTex,
		attenuationColor: new THREE.Color( 0xffc964 ),
        attenuationDistance: .5,
        roughness: 0.75,
        metalness: 0.0,
        ior: 1.5,
    } );
	sssMaterial.emissiveNode = add(
		add( sssMaterial.emissiveNode ?? vec3( 0, 0, 0 ), fakeSssFromPoint ),
		fakeSssFromKey
	);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load( '/assets/subsurfHD.glb', ( result ) => {

        result.scene.scale.setScalar( 2.5 );
		
		result.scene.traverse( ( child ) => {

            if ( child.isMesh ) {

                child.material = sssMaterial;

            }

        } );

        this.add( result.scene );

    } );

	const atomsMaterial = new THREE.MeshPhysicalNodeMaterial( {
		color: 0xffffff,
		vertexColors: true,
        transmission: 1,
        roughness: 0.125,
        metalness: 0.0,
        ior: 1.25,
    } );

	const gltfLoaderAtom = new GLTFLoader();
    gltfLoader.load( '/assets/atoms.glb', ( resultAtom ) => {

        resultAtom.scene.scale.setScalar( 2.5 );

		resultAtom.scene.traverse( ( child ) => {

            if ( child.isMesh ) {

                child.material = atomsMaterial;

            }

        } );
	

        this.add( resultAtom.scene );

    } );

	const gltfLoaderBands = new GLTFLoader();
    gltfLoader.load( '/assets/bands.glb', ( resultBands ) => {

        resultBands.scene.scale.setScalar( 2.5 );
	

        this.add( resultBands.scene );

    } );

} );
		//Background Sphere

		const bckTxtLoader = new THREE.ImageBitmapLoader();
		bckTxtLoader.setOptions( { imageOrientation: 'flipY' } );
		bckTxtLoader.load( '/assets/bckgrnd.png', ( bitmap ) => {
			const bckMap = new THREE.Texture( bitmap );
			bckMap.colorSpace = THREE.SRGBColorSpace;
			bckMap.needsUpdate = true;
			const bckMat = new THREE.MeshPhysicalNodeMaterial( {
				map: bckMap,
				color: 0xffffff,
				side: THREE.DoubleSide,
				metalness: 0,
				roughness: 1,
			} );
			const bckSphLoader = new GLTFLoader();
			bckSphLoader.load( '/assets/Background.glb', ( gltf ) => {
				const root = gltf.scene;
				root.scale.setScalar( 10 );
				root.traverse( ( child ) => {
					if ( child.isMesh ) {
						child.material = bckMat;
					}
				} );
				this.add( root );
			} );
		} );


        // Lighting

		// scene.add( new THREE.AmbientLight( 0xffffff, 1 ) );





        // const result = await new GLTFLoader().loadAsync('model.glb');
        // console.log(result);
        //this.add(result.scene);

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

	onRaf() {

		if ( this._pointLight1 && this._sssLightWorldPosition ) {

			this._pointLight1.getWorldPosition( this._sssLightWorldPosition.value );

		}

		if ( this._keyDirectionalLight && this._sssKeyLightToward && this._keyLightWorldPos && this._keyTargetWorldPos ) {

			this._keyDirectionalLight.getWorldPosition( this._keyLightWorldPos );
			this._keyDirectionalLight.target.getWorldPosition( this._keyTargetWorldPos );
			this._sssKeyLightToward.value.subVectors( this._keyLightWorldPos, this._keyTargetWorldPos ).normalize();

		}

		if ( this._lightPivot && this._clock ) {

			const speed = .25;

			this._lightPivot.rotation.y += speed * this._clock.getDelta();
			this._lightPivot.rotation.x = THREE.MathUtils.degToRad( 15 );

		}

	}

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