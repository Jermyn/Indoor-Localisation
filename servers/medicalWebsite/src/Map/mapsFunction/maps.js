import React, { Component } from 'react';
import ReactMapboxGl from 'react-mapbox-gl';
import { Source,Layer, Feature } from "react-mapbox-gl";
import mapboxgl from 'mapbox-gl';
import _ from 'underscore'
import theme from '../../draw-theme'
import MapboxDraw from '@mapbox/mapbox-gl-draw'


const TOKEN = 'pk.eyJ1IjoiZnlwZW5nIiwiYSI6ImNqcmFlazM4YjAxejkzeW1wbWg2Zmp2aWsifQ.obOnEjbqcpEWu9HIh6zPlw';

const ReactMap = ReactMapboxGl({
    accessToken: `${TOKEN}`,
    maxZoom: 13,
    minZoom: 8,
})

const draw = new MapboxDraw({
    userProperties: true,
    styles: theme,
    controls: {
      line_string: true,
      polygon: true,
      combine_features: true,
      uncombine_features: true
    },
  });

let loaded = false;
  

export default class testLoadMap extends Component {
    constructor(props) {
        super(props);
        this.mapLocation = React.createRef()
        this.state = {
        viewport: {
            latitude: 37.785164,
            longitude: -100,
            zoom: 2.8,
            bearing: 0,
            pitch: 0,
            width: '100%',
            height: '100%',
        },
        center: [0, 0],
        map: '',
        sourceOptions: {},
        mobileDevices: [],
        circleRadius: 30
        };
        this.getAll = this.getAll.bind(this);
        this.onStyleLoad = this.onStyleLoad.bind(this);
    }

    componentDidMount() {
        window.addEventListener('resize', this._resize);
        //this._resize();
        // if(this.props.map != null) {
        //   this.initializeMap(this.props.map);
        // }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._resize);
        clearInterval(this.timer)
    }

    static getDerivedStateFromProps(props, state) {
        if(props.map !== state.map) {
            return {
                map: props.map
            }
        }
        else {
            return null
        }
    }

    componentDidUpdate(prevProps) {
        if (!_.isEqual(prevProps.map, this.props.map)) {
            this.initializeMap(this.props.map);
        }
        if (loaded && !_.isEqual(prevProps.featureCollection, this.props.featureCollection)) {
            this.updateFeatureCollection(this.props.featureCollection);
        }
          
    }

    initializeMap = (map, jump) => {
        // console.log(map)
    //     if(map != null) {
    //       if(map.id == "simulation_ward") {
    //         map = JSON.parse(JSON.stringify(map))
    //         map.coordinates = [[0, 0.114], [0.6217262964, 0.114], [0.6217262964, 0],[0,0]]
    //         this.setState({map})
    //         console.log(Date.now())
    //         this.timer = setInterval(()=> this.props.fetchSimulationCoordinates(), 1000);
    //         this.setState({simulation: true})
    //       }
    
    //   //    (0,0), (0.6217262964, 0), (0, 0.1099696441), (0.6217262964, 0.1099696441)
    //     }
        if (map!=null) {
            const mapgl = this.mapLocation.current.state.map
            let sourceOptions = {
            coordinates: (map != null ? map.coordinates : undefined),
            type:         'image',
            url:          (map != null ? map.imageURL : undefined)
            }
            this.setState({sourceOptions})
            if (mapgl.getLayer('image_layer') != null) { mapgl.removeLayer('image_layer'); }
            if (mapgl.getSource('image_source') != null) { mapgl.removeSource('image_source'); }
            mapgl.addSource('image_source', {
            coordinates:  (map != null ? map.coordinates : undefined),
            type:         'image',
            url:          (map != null ? map.imageURL : undefined)
            });
            mapgl.addLayer({
            id:     'image_layer',
            source: 'image_source',
            type:   'raster'
            }, 'reference_bottom');
    
        //   const bounds = new mapboxgl.LngLatBounds(this.__guard__(map != null ? map.coordinates : undefined, x => x[3]), this.__guard__(map != null ? map.coordinates : undefined, x1 => x1[1]));
            const bounds = new mapboxgl.LngLatBounds(map.coordinates[3], map.coordinates[1])  
            let center = bounds.getCenter();
            this.setState({center})
            mapgl.resize();
            mapgl.jumpTo({center: this.state.center});
        //   if(this.state.simulation == false) {
        //     this.createBeaconMarkers()
        //     console.log(this.props.patients)
    
        //     let staticDevices = this.props.devices.filter(device => device.type == 'static');
        //     console.log(staticDevices);
        //     staticDevices = staticDevices.filter(device => device.location != null)
        //     console.log(staticDevices);
        //     staticDevices = staticDevices.filter(device => device.location.map.id == map.id)
        //     console.log(staticDevices);
        //     this.setState({staticDevices})
        //   } else {
        //     if(this.props.simulation != "" && this.props.simulation != null) {
        //       let simulation = this.props.simulation
        //       let devices = []
        //       const entries = Object.values(simulation)
        //       console.log(entries)
    
        //       entries.map((contact) => {
        //           if(typeof contact === 'object' && contact !== null && contact.beacon != null) {
        //             console.log(contact)
        //             devices.push(
        //             <Feature
        //               key={contact.beacon}
        //               coordinates={[contact.latitude, contact.longitude]}
        //               properties={{
        //                 title:  contact.beacon,
        //                 id:     contact.beacon
        //               }}
        //             />)
        //           }
        //           })
        //           this.setState({mobileDevices: devices})
        //     }
        //   }
    
        }
        else {
            const mapgl = this.mapLocation.current.state.map
            let sourceOptions = {
                coordinates: (map != null ? map.coordinates : undefined),
                type:         'image',
                url:          (map != null ? map.imageURL : undefined)
            }
            this.setState({sourceOptions})
            if (mapgl.getLayer('image_layer') != null) { mapgl.removeLayer('image_layer'); }
            if (mapgl.getSource('image_source') != null) { mapgl.removeSource('image_source') }
            mapgl.resize();
        }
        
    
    }

    onStyleLoad = (mapgl) => {
        const { map } = this.props;
        if (map != null) { this.initializeMap(map); }
        this.onLoad(mapgl)
    }
    
    getCirclePaint = () => ({
    'circle-radius': this.state.circleRadius,
    'circle-color': '#FFFF00',
    'circle-opacity': 0.4
    });
    
    _resize = () => {
    this.setState({
        viewport: {
        ...this.state.viewport,
        width: '100vw',
        height: '100vh'
        }
    });
    };

    _updateViewport = (viewport) => {
        this.setState({viewport});
    }

    __guard__ = (value, transform) => {
    return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
    }

    onLoad = (mapgl) => {
        const { onEditFeatures, onDeleteFeatures, featureCollection } = this.props;
        mapgl.addControl(draw);
        mapgl.on('draw.delete', function({features}) {
            onDeleteFeatures(features);
        });
        mapgl.on('draw.update', function({features}) {
            onEditFeatures(features);
        });
        setTimeout(() => {
            this.updateFeatureCollection(featureCollection);
        }, 500);
        loaded = true
    };

    getSelected = () => {
        return draw.getSelected();
    };

    
    getAll = () => {
        return draw.getAll();
    }
    

    mapgl = () => {
        return this.mapLocation.current.state.map;
    };

    updateFeatureCollection = (featureCollection) => {
    	featureCollection ? draw.deleteAll().add(featureCollection) : void 0
        
    };

    renderDevices = (type) => {
        let devices = []
        let createDevices = []
        const { mobileDevices } = this.props;
        createDevices = mobileDevices.map((device) => {
            devices.push(
            <Feature
            key={device.id}
            coordinates={[device.lng, device.lat]}
            properties={{
                title:  device.id,
                id:     device.id
            }}
            />)
        })
        return devices;
      }
    
      renderHighlightDevices = () => {
        let patients = this.props.patients;
        let staff = this.props.staff;
        let assets = this.props.assets;
        let beacons = this.props.mobileDevices;
        let devices = []
        // console.log (beacons)
        for(let i = 0 ; i < patients.length; i++) {
    
          beacons.map((device) => {
            if(patients[i].name == device.id && patients[i].highlight == true) {
            devices.push(
            <Feature
              key={device.id}
              coordinates={[device.lng, device.lat]}
              properties={{
                title:  device.id,
                id:     device.id
              }}
            />)
          }})
        }
    
        // for(let i = 0 ; i < staff.length; i++) {
    
        //   this.state.staffDevices.map((device) => {
        //     if(staff[i].name == device.id && staff[i].highlight == true) {
        //     devices.push(
        //     <Feature
        //       key={device.id}
        //       coordinates={[device.lng, device.lat]}
        //       properties={{
        //         title:  device.id,
        //         id:     device.id
        //       }}
        //     />)
        //   }})
        // }
    
        // for(let i = 0 ; i < assets.length; i++) {
    
        //   this.state.assetDevices.map((device) => {
        //     if(assets[i].name == device.id && assets[i].highlight == true) {
        //     devices.push(
        //     <Feature
        //       key={device.id}
        //       coordinates={[device.lng, device.lat]}
        //       properties={{
        //         title:  device.id,
        //         id:     device.id
        //       }}
        //     />)
        //   }})
        // }
        return devices;
      }


    
    render() {
        let center = this.state.center
        let locationOrigin = window.location.origin
        let sourceOptions = this.state.sourceOptions
        const { staticDevices } = this.props;
        // let imageURL = "mapbox://styles/mapbox/dark-v9";
        let style = {
            position: 'fixed',
            version:  8,    
            name:     'custom',
            sources:  {},
            sprite:   `${locationOrigin}/mapbox-styles/maki`,
            glyphs:   `${locationOrigin}/mapbox-styles/font/{fontstack}/{range}.pbf`,
            layers:   []
        }
    return (
            <ReactMap
                style={style}
                ref={this.mapLocation}
                center={center}
                movingMethod={'jumpTo'}
                containerStyle={{
                    height: '80vh',
                    width: '100vw - 24px'}}
                onStyleLoad={this.onStyleLoad}
            >
            <Layer
                type="background"
                id="background_layer"
                paint={{ 'background-color': '#FFFFFF' }}
            />
            <Layer
                type="background"
                id="reference_bottom"
                layout={{ visibility: 'none' }}
            />
            <Layer
                type="background"
                id="reference_top"
                layout={{ visibility: 'none' }}
            />
            <Layer type="symbol"
                id="patientDevices"
                layout={{
                'icon-image':             'lodging-15',
                'icon-allow-overlap':     true,
                'icon-ignore-placement':  true,
                'text-allow-overlap':     true,
                'text-ignore-placement':  true,
                'text-field':             '{title}',
                'text-font':              ['Open Sans Semibold'],
                'text-offset':            [0, 0.8],
                'text-anchor':            'top',
                }}>

                {
                this.renderDevices('mobile')
                }
            </Layer>
            <Layer type="circle"  paint={this.getCirclePaint()}>
                {
                    this.renderHighlightDevices()
                }
            </Layer>
            </ReactMap>
        );
    }
}