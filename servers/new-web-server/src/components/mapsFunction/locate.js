import React, { Component } from 'react';
import ReactMapboxGl from 'react-mapbox-gl';
import { Layer, Feature } from "react-mapbox-gl";
import mapboxgl from 'mapbox-gl';
import _ from 'underscore'
import theme from '../../draw-theme'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { breakStatement } from '@babel/types';


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
        neighborsResult: {}
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
            // console.log(mapgl.state.map.getLayer('image_layer'))
            let sourceOptions = {
            coordinates: (map != null ? map.coordinates : undefined),
            type:         'image',
            url:          (map != null ? map.imageURL : undefined)
            }
            this.setState({sourceOptions})
            let layerOptions = {
            id: 'image_layer',
            source: 'image_source',
            type: 'raster'
            }
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
    'circle-radius': 30,
    'circle-color': '#FFFF00',
    'circle-opacity': 0.4
    });

    getCircleBorder = () => ({
        'circle-stroke-color': 'red',
        'circle-stroke-width':3,
        'circle-radius': 30,
        // 'circle-color': 'none',
        'circle-opacity': 0.1
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
        draw.deleteAll().add(featureCollection)
    };

    computeNeighborsDevices = (neighbors) => {
        const { staticDevices } = this.props;
        let neighborsResult = []
        // neighbors.map(function(neighbor) {
        staticDevices.map(function({id, location}) {
            let result = (neighbors.includes(id) == false ? {id, location} : void 0)
            if (result != undefined) {
                neighborsResult.push(result)
            }
            }
        )
        return neighborsResult
    };

    
    render() {
        const {staticDevices, transientDevices, movingDevices, onTroubleshoot } = this.props;
        console.log (transientDevices)
        let neighbors = (movingDevices[0] != undefined ? movingDevices[0]["neighbors"] : void 0)
        let result = (neighbors != undefined ? this.computeNeighborsDevices(neighbors) : void 0)
        let imageURL = "mapbox://styles/mapbox/dark-v9";
        let center = this.state.center
        let locationOrigin = window.location.origin
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
                    height: '100vh',
                    width: '100vw - 24px'}}
                // onStyleLoad={this.onStyleLoad}
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
                <Layer
                    type="symbol"
                    id="staticDevices"
                    layout={{
                        'icon-image':             'triangle-15',
                        'icon-allow-overlap':     true,
                        'icon-ignore-placement':  true,
                        'text-allow-overlap':     true,
                        'text-ignore-placement':  true,
                        'text-field':             '{title}',
                        'text-font':              ['Open Sans Semibold'],
                        'text-offset':            [0, 0.8],
                        'text-anchor':            'top'
                    }}
                >
                {staticDevices.map(function({id, location}) {
                    return (<Feature
                        key={id}
                        coordinates={[location != null ? location.lng : void 0, location != null ? location.lat : void 0]}
                        properties={{
                        title: id,
                        id: id
                        }}/>
                    )})
                }
                </Layer>
                <Layer
                        type="symbol"
                        id="mobileDevices"
                        layout={{
                            'icon-image':             'marker-15',
                            'icon-allow-overlap':     true,
                            'icon-ignore-placement':  true,
                            'text-allow-overlap':     true,
                            'text-ignore-placement':  true,
                            'text-field':             '{title}',
                            'text-font':              ['Open Sans Semibold'],
                            'text-offset':            [0, 0.8],
                            'text-anchor':            'top'
                        }}
                    >
                    {_(transientDevices).map(function({lat, lng}, id) {
                        return (<Feature
                            key={id}
                            coordinates={[lng != null ? lng : void 0, lat != null ? lat : void 0]}
                            properties={{
                                title: id,
                                id: id
                            }}/>
                        )})
                    }
                </Layer>
                <Layer type="circle"  paint={this.getCirclePaint()}>
                {_(movingDevices).map(function({lat, lng, id}) {
                    return (
                        <Feature
                            key={id}
                            coordinates={[lng != null ? lng : void 0, lat != null ? lat : void 0]}
                            properties={{
                                title: id,
                                id: id
                            }}/>
                        )
                    })
                }
                </Layer>
                {onTroubleshoot == true ?
                    <Layer type="circle"  paint={this.getCircleBorder()}>
                    {result != undefined ? _(result).map(function({id, location}) {
                        return (<Feature
                            key={id}
                            coordinates={[location != null ? location.lng : void 0, location != null ? location.lat : void 0]}
                            properties={{
                            title: id,
                            id: id
                            }}/>
                        )
                        })
                    : void 0}
                    </Layer>
                : void 0}
            </ReactMap>
        );
    }
}