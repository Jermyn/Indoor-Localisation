import React, {Component} from 'react';
import { connect } from "react-redux";
import _ from 'underscore'
import Promise from 'bluebird'
import { fetchMaps, updateDevice, confirmType, fetchSimulationCoordinates, updateMap, fetchDevices, loadMap } from "../../actions/index";
import MapGL, {Marker, Popup, NavigationControl} from 'react-map-gl';
import ReactMapboxGl from 'react-mapbox-gl';
import { Source, Layer, Feature } from "react-mapbox-gl";
import mapboxgl from 'mapbox-gl';
import MapsPanel from '../../MapsPanel'
import LoadMap from '../../Map/mapsFunction/maps'
import MaterialDialogForm from '../../MaterialDialogForm'
// import StatePin from './StatePin'
import { withStyles } from '@material-ui/core/styles';
const e             = React.createElement;


// const TOKEN = 'pk.eyJ1IjoiZnlwZW5nIiwiYSI6ImNqcmFlazM4YjAxejkzeW1wbWg2Zmp2aWsifQ.obOnEjbqcpEWu9HIh6zPlw'; // Set your mapbox token here
// const graphqlUrlHTTPS = 'http://137.132.165.139:3000/graphql';

// const ReactMap = ReactMapboxGl({
//   accessToken: `${TOKEN}`,
//   maxZoom:    13,
//   minZoom:    8,
// })
// const navStyle = {
//   position: 'absolute',
//   top: 0,
//   left: 0,
//   padding: '10px'
// };

function imageDimensions (file) {
  return new Promise(function(resolve, reject) {
    var img;
    if (!file) {
      return reject();
    }
    img = new Image;
    img.onload = function() {
      return resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = function() {
      return reject();
    };
    return img.src = URL.createObjectURL(file);
  });
}

function calculateOverlayCoordinates ({width, height, mapgl}) {
  var bounds, mid, northEast, offset, pixelBottom, southWest;
  pixelBottom = mapgl.project([0, 0]);
  mid = pixelBottom.y / 2;
  offset = mid - (height / 2);
  southWest = mapgl.unproject([0, height + offset]);
  northEast = mapgl.unproject([width, offset]);
  bounds = new mapboxgl.LngLatBounds(southWest, northEast);
  return [bounds.getNorthWest().toArray(), bounds.getNorthEast().toArray(), bounds.getSouthEast().toArray(), bounds.getSouthWest().toArray()];
}

const styles = theme => ({
  button: {
    display: 'block',
    marginTop: theme.spacing.unit * 2,
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
  },
  paint: {
      'background-color' : '#FFFFFF',
  },
  visibility: {
      visibility: 'none',
  },
});

const mapStateToProps = state => {
  return {
    maps: state.maps,
    map: state.map,
    devices: state.devices,
    deviceLogs: state.deviceLogs,
    patients: state.patients,
    staff: state.staff,
    assets: state.assets,
    simulation: state.simulation,
    // featureCollection: state.featureCollection,
    currentMap: state.currentMap,
    staticDevices: state.staticDevices
  };
};

const mapDispatchToProps = dispatch => {
  return {
    confirmType: type => dispatch(confirmType(type)),
    fetchMaps: maps => dispatch(fetchMaps(maps)),
    fetchSimulationCoordinates: coord => dispatch(fetchSimulationCoordinates(coord)),
    loadMap: map => dispatch(loadMap(map)),
    updateDevice: device => dispatch(updateDevice(device))
  };
};

class Map extends Component {

  constructor(props) {
    super(props);
    this.mapView = React.createRef();
    this.state = {
      // viewport: {
      //   latitude: 37.785164,
      //   longitude: -100,
      //   zoom: 2.8,
      //   bearing: 0,
      //   pitch: 0,
      //   width: 500,
      //   height: 500,
      // },
      measuredRadians: null,
      loadMapOpen: false,
      createMapOpen: false,
      editMapOpen: false,
      deleteMapOpen: false,
      measuredOpen: false,
      assignDevOpen: false,
      assignPOIOpen: false,
      mapImage: null,
      selectedMap: null,
      image: null,
      id: '',
      scale: 0,
      mapView: null,
      // popupInfo: null,
      // map: '',
      // sourceOptions: {},
      // center: [-0.2416815, 51.5285582 ],
      // staticDevices: "",
      mobileDevices: [],
      // staffDevices: [],
      // assetDevices: [],
      // circleRadius: 30,
      // simulation: false,

    };
    // this.mapLocation = React.createRef(),
    // this.inputNew = React.createRef()
  }

  componentDidMount() {
    // window.addEventListener('resize', this._resize);
    //this._resize();
    // if(this.props.map != null) {
    //   this.initializeMap(this.props.map);
    // }
    fetchMaps()
    fetchDevices()
  }

  // componentWillUnmount() {
  //   window.removeEventListener('resize', this._resize);
  //   clearInterval(this.timer)
  // }

  componentDidUpdate(prevProps) {
  //   if (!_.isEqual(prevProps.map, this.props.map)) {
  //     this.initializeMap(this.props.map);
  // }
  // if (loaded && !_.isEqual(prevProps.featureCollection, this.props.featureCollection)) {
  //     this.updateFeatureCollection(this.props.featureCollection);
  // }

    if(this.props.deviceLogs !== prevProps.deviceLogs) {
      this.createBeaconMarkers()
    }
  }

  //
  // mapgl = () => {
  //   return this.refs.map.getChildContext().map;
  // }

  // getChildContext = () => {
  //   return { map: this.map };
  // };

  // static getDerivedStateFromProps(props, state) {
  //   if(props.map != state.map && props.map != null) {
  //     return {
  //       map: props.map
  //     }
  //   }
  // }

  onCreateMap = () => {
    const mapView = this.mapView.current;
    // const { actions } = this.props;
    const map = {
        id: this.state.id,
        image: this.state.image,
        scale: this.state.scale,
        coordinates: null
    }
    imageDimensions(map.image).then(function({width, height}) {
      map.coordinates = calculateOverlayCoordinates({
        width,
        height,
        mapgl: mapView.mapgl()
      });
      // actions.maps.create(packageMap(map)).then(function() {
      //   actions.maps.fetch();
      //   actions.maps.load(map.id);
      // });
    });
    this.setState({ createMapOpen: false })
  }

  onEditMap = () => {
    const { currentMap } = this.props;
    updateMap({
      id:currentMap.id,
      scale:this.state.scale
    })
    // actions.maps.update({
    //     id: currentMap.id,
    //     scale: this.state.scale
    // })
    this.setState({ editMapOpen: false })
  }

  onAssignStaticDevices = (e, id) => {
    const mapView = this.mapView.current;
    const { currentMap, updateDevice } = this.props;
    _(mapView.getSelected().features).first(1).filter(function({geometry}) {
        return geometry.type === 'Point';
      }).forEach(function(x) {
        return updateDevice({
          device: {
            id: id,
            location: {
              lat: x.geometry.coordinates[1],
              lng: x.geometry.coordinates[0],
              map: _.pick(currentMap, 'id', 'scale', 'coordinates')
            }
          }
        });
      });
      this.setState({ assignDevOpen: false })
  }

  onEditFeatures = (features) => {
    const { currentMap, updateDevice } = this.props;
    // edit static devices
    Promise.map(features.filter(function({properties}) {
        var ref;
        return ((ref = properties.device) != null ? ref.id : void 0) != null;
    }), function({properties, geometry}) {
        return updateDevice({
        device: {
            id: properties.device.id,
            location: {
            map: _.pick(currentMap, 'id', 'scale', 'coordinates'),
            lat: geometry.coordinates[1],
            lng: geometry.coordinates[0]
            }
        }
        });
    });
}

onDeleteFeatures = (features) => {
  const { updateDevice } = this.props;
  //delete NavPath
  _.chain(features).filter(function({properties}) {
      return (properties != null ? properties.type : void 0) === 'nav-path';
  }).first(1).each(() => {
      return this.onAssignNavPath({
          id:null
      });
  });
  //delete NavMesh
  _.chain(features).filter(function({properties}) {
      return (properties != null ? properties.type : void 0) === 'nav-mesh';
  }).first(1).each(() => {
      return this.onAssignNavMesh({
          id:null
      });
  });
  // delete poi
  _.chain(features).filter(function({properties}) {
      return (properties != null ? properties.type : void 0) === 'poi';
  }).first(1).each(() => {
      return this.onAssignPOI({
      id: null
      });
  });

  // delete static device
  Promise.map(_.chain(features).pluck('properties').pluck('device').pluck('id').compact().value(), function(id) {
      return updateDevice({
      device: {
          id: id,
          location: null
      }
      });
  });
}

onLoadMap = (e, res) => {
  // const { actions } = this.props;
  e.preventDefault();
  this.props.loadMap(res)
  this.setState({ loadMapOpen: false })
}

handleLoadClose = () => {
  this.setState({ loadMapOpen: false });
};

handleLoadOpen = () => {
  this.setState({ loadMapOpen: true });
};

handleChange = (e) => {
  this.setState({
      [e.target.id] : e.target.value
  })
}

handleCreateClose = () => {
  this.setState({ createMapOpen: false });
};

handleCreateOpen = () => {
  this.setState({ createMapOpen: true });
};

handleEditClose = () => {
  this.setState({ editMapOpen: false });
};

handleEditOpen = () => {
  this.setState({ editMapOpen: true });
};

handleDeleteClose = () => {
  this.setState({ deleteMapOpen: false });
};

handleDeleteOpen = () => {
  this.setState({ deleteMapOpen: true });
};

handleMeasuredClose = () => {
  this.setState({ measuredOpen: false });
};

handleMeasuredOpen = () => {
  this.setState({ measuredOpen: true });
};

handleAssignDevClose = () => {
  this.setState({ assignDevOpen: false });
};

handleAssignDevOpen = () => {
  this.setState({ assignDevOpen: true });
};

handleAssignPOIClose = () => {
  this.setState({ assignPOIOpen: false });
};

handleAssignPOIOpen = () => {
  this.setState({ assignPOIOpen: true });
};

handleImageChange = (e) => {
  if (e.target.files[0]) {
      const image = e.target.files[0];
      this.setState(() => ({ image }));
  }
}

handleSelectedMap = (e) => {
  this.setState({ selectedMap: e.target.value })
};

handleCreatedMap = (e) => {
  this.setState({ createdMap: e.target.value })
};


  createBeaconMarkers = () => {
    let map = this.props.map
    if(map != "") {
      let filteredLogs = this.props.deviceLogs.filter(device => device.map.id == map.id);
      let mobileDevices = []
      let staffDevices = []
      let assetDevices = []
      filteredLogs.map(device => {
        this.props.patients.forEach(patient => {
          if(patient.beacon != null) {
            if(device.id == patient.beacon[1].id) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = patient.name
              mobileDevices.push(newObj)
            }
          }
        })

        this.props.staff.forEach(staffmem => {
          if(staffmem.beacon != null) {
          if(device.id == staffmem.beacon[0]) {
            let newObj = JSON.parse(JSON.stringify(device))
            newObj.id = staffmem.name

            staffDevices.push(newObj)
          }
        }
        })

        this.props.assets.forEach(asset => {
          if(asset.beacon != null) {
            if(device.id == asset.beacon[0]) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = asset.name

              assetDevices.push(newObj)
            }
          }
        })


      })
      this.setState({mobileDevices})
      this.setState({staffDevices})
      this.setState({assetDevices})
    }

  }
  // initializeMap = (map, jump) => {

    // if(map != null) {
    //   if(map.id == "simulation_ward") {
    //     map = JSON.parse(JSON.stringify(map))
    //     map.coordinates = [[0, 0.114], [0.6217262964, 0.114], [0.6217262964, 0],[0,0]]
    //     this.setState({map})
    //     this.timer = setInterval(()=> this.props.fetchSimulationCoordinates(), 1000);
    //     this.setState({simulation: true})
    //   }
    // }

    // let sourceOptions = {
    //   coordinates: (map != null ? map.coordinates : undefined),
    //   type:         'image',
    //   url:          (map != null ? map.imageURL : undefined)
    // }
    // this.setState({sourceOptions})

  //   if(map != "") {
  //     const bounds = new mapboxgl.LngLatBounds(this.__guard__(map != null ? map.coordinates : undefined, x => x[3]), this.__guard__(map != null ? map.coordinates : undefined, x1 => x1[1]));
  //     let center = bounds.getCenter();
  //     this.setState({center});
  //     if(this.state.simulation == false) {
  //       this.createBeaconMarkers()
  //       let staticDevices = this.props.devices.filter(device => device.type == 'static');
  //       staticDevices = staticDevices.filter(device => device.location != null)
  //       staticDevices = staticDevices.filter(device => device.location.map.id == map.id)
  //       this.setState({staticDevices})
  //     } else {
  //       if(this.props.simulation != "" && this.props.simulation != null) {
  //         let simulation = this.props.simulation
  //         let devices = []
  //         const entries = Object.values(simulation)

  //         entries.map((contact) => {
  //             if(typeof contact === 'object' && contact !== null && contact.beacon != null) {
  //               devices.push(
  //               <Feature
  //                 key={contact.beacon}
  //                 coordinates={[contact.latitude, contact.longitude]}
  //                 properties={{
  //                   title:  contact.beacon,
  //                   id:     contact.beacon
  //                 }}
  //               />)
  //             }
  //             })
  //             this.setState({mobileDevices: devices})
  //       }
  //     }

  //   }
  // }

  // onStyleLoad = (mapgl) => {
  //   const { onLoad, map } = this.props;
  //   if (map != null) { this.initializeMap(map); }
  // }

  // getCirclePaint = () => ({
  //   'circle-radius': this.state.circleRadius,
  //   'circle-color': '#FFFF00',
  //   'circle-opacity': 0.4
  // });

  // _resize = () => {
  //   this.setState({
  //     viewport: {
  //       ...this.state.viewport,
  //       width: window.innerWidth,
  //       height: '70vh'
  //     }
  //   });
  // };

  // _updateViewport = (viewport) => {
  //   this.setState({viewport});
  // }

  // __guard__ = (value, transform) => {
  //   return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
  // }

  renderHighlightDevices = () => {
    let patients = this.props.patients;
    let staff = this.props.staff;
    let assets = this.props.assets;
    let beacons = this.state.mobileDevices;
    let devices = []

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

    for(let i = 0 ; i < staff.length; i++) {

      this.state.staffDevices.map((device) => {
        if(staff[i].name == device.id && staff[i].highlight == true) {
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

    for(let i = 0 ; i < assets.length; i++) {

      this.state.assetDevices.map((device) => {
        if(assets[i].name == device.id && assets[i].highlight == true) {
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

    return devices;
  }

  renderStaffDevices = () => {
    let devices = []
    this.state.staffDevices.map((device) => {
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

    return devices
  }

  renderAssetDevices = () => {
    let devices = []
    this.state.assetDevices.map((device) => {
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

    return devices
  }
  renderDevices = (type) => {
    let devices = []
    let createDevices = []
    if(type == 'static')
      createDevices = this.state.staticDevices.map ((device) => {
        devices.push(
        <Feature
          key={device.id}
          coordinates={[device.location.lng, device.location.lat]}
          properties={{
            title:  device.id,
            id:     device.id
          }}
        />)
      })
    else {

      if(this.state.simulation) {
        if(this.props.simulation != "" && this.props.simulation != null) {
          let simulation = this.props.simulation
          const entries = Object.values(simulation)

            createDevices = entries.map((contact) => {
              if(typeof contact === 'object' && contact !== null && contact.beacon != null) {
                devices.push(
                <Feature
                  key={contact.beacon}
                  coordinates={[contact.latitude, contact.longitude]}
                  properties={{
                    title:  contact.beacon,
                    id:     contact.beacon
                  }}
                />)
              }
              })

        }
      } else {
        createDevices = this.state.mobileDevices.map((device) => {
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
      }
    }
    return devices;
  }
  renderPopup = () => {
    return this.state.popupInfo && (
      <Popup tipSize={5}
        anchor="bottom-right"
        longitude={this.state.popupInfo.state.longitude}
        latitude={this.state.popupInfo.state.latitude}
        onClose={() => this.setState({popupInfo: null})}
        closeOnClick={true}>
        <h4>{this.state.popupInfo.state.fullName}</h4>
        <p>{this.state.popupInfo.incidentNumber} {this.state.popupInfo.disaster} incident(s)</p>
        <div class="text-center">
        <img src={this.state.popupInfo.icon.imgUrl} style={{height: "50px"}} />
        </div>
      </Popup>

      )
  }

  render() {
    const {viewport, mobileDevices} = this.state;
    let sourceOptions = this.state.sourceOptions
    let imageURL = "mapbox://styles/mapbox/dark-v9";
    // let center = this.state.center
    // if(this.props.map != "") {
    // }
    const { children, onLoad, map, height, width, currentMap, featureCollection, maps, staticDevices, patients } = this.props;
    // let locationOrigin = window.location.origin

    // let style = {
    //     version:  8,
    //     name:     'custom',
    //     sources:  {},
    //     sprite:   `${locationOrigin}/mapbox-styles/maki`,
    //     glyphs:   `${locationOrigin}/mapbox-styles/font/{fontstack}/{range}.pbf`,
    //     layers:   []
    // }

    return (
      <div>
        <MapsPanel
            // onLoad={this.handleLoadOpen}
            // onCreate={this.handleCreateOpen}
            // onSave={this.onSave}
            // onEdit={this.handleEditOpen}
            // onDelete={this.handleDeleteOpen}
            // onMeasure={this.onMeasure}
            onAssignStaticDevice={this.handleAssignDevOpen}
            // onAssignPOI={this.handleAssignPOIOpen}
            // onAssignNavPath={this.onAssignNavPath}
            // onAssignNavMesh={this.onAssignNavMesh}
        />
        <LoadMap
            ref={this.mapView}
            map={currentMap}
            featureCollection={featureCollection}
            staticDevices={staticDevices}
            onEditFeatures={this.onEditFeatures}
            onDeleteFeatures={this.onDeleteFeatures}
            mobileDevices={mobileDevices}
            patients={patients}
        />
        {/* <MaterialDialogForm
                      title="Create Map"
                      open={this.state.createMapOpen} 
                      onClose={this.handleCreateClose} 
                      aria_id="Create-Map"
                      onChange={this.handleChange}
                      onImgChange={this.handleImageChange}
                      onCreate={this.handleCreatedMap}
                      rows={[
                        {key: 'id', type: 'text', label: 'id', required: true},
                        {key: 'scale', type: 'text', label: 'scale'},
                        {key: 'image', type: 'file', label: 'image'}
                      ]}
                      onSubmit={this.onCreateMap}                
                  />
                  <MaterialDialogForm
                      title="Edit Map"
                      open={this.state.editMapOpen} 
                      onClose={this.handleEditClose} 
                      aria_id="Edit-Map"
                      onChange={this.handleChange}
                      rows={[
                        {key: 'id', type: 'text', readOnly: true, label: 'id', required: true, defaultValue: currentMap != null ? currentMap.id : void 0},
                        {key: 'scale', type: 'text', label: 'scale', defaultValue: currentMap != null ? currentMap.scale : void 0}
                      ]}
                      onSubmit={this.onEditMap}                
                  />
                  <MaterialDialogForm
                      title="Delete Map"
                      open={this.state.deleteMapOpen} 
                      onClose={this.handleDeleteClose} 
                      aria_id="Delete-Map"
                      onChange={this.handleChange}
                      rows={[
                        {key: 'id', type: 'text', readOnly: true, label: 'id', defaultValue: currentMap != null ? currentMap.id : void 0}
                      ]}
                      onSubmit={this.onDeleteMap}                
                  />
                  <MaterialDialogForm
                      title="Load Map"
                      open={this.state.loadMapOpen} 
                      onClose={this.handleLoadClose} 
                      aria_id="Load-Map"
                      onChange={this.handleChange}
                      onLoadMap={this.handleSelectedMap}
                      rows={[
                        {key: 'id', type: 'select', label: 'id', items: maps.map(({id}) => {return id})}
                      ]}
                      onSubmit={this.onLoadMap}             
                  />
                  <MaterialDialogForm
                      title="Measure Distance"
                      open={this.state.measuredOpen} 
                      onClose={this.handleMeasuredClose} 
                      aria_id="Measure-Distance"
                      onChange={this.handleChange}
                      rows={[
                        {key: 'length', type: 'text', label: 'radians', readOnly: true, defaultValue: this.state.measuredRadians}
                      ]}             
                  /> */}
                  <MaterialDialogForm
                      title="Assign Device"
                      open={this.state.assignDevOpen} 
                      onClose={this.handleAssignDevClose} 
                      aria_id="Assign-Device"
                      onChange={this.handleChange}
                      rows={[
                        {key: 'id', type: 'select', label: 'id', items: staticDevices.filter(function(x) {
                            var ref,ref1
                            return ((ref = x.location) != null ? (ref1 = ref.map) != null ? ref1.id : void 0 : void 0) == null})
                            .map(function({id}) {return id})}
                      ]}
                      onSubmit={this.onAssignStaticDevices}             
                  />
                  {/* <MaterialDialogForm
                      title="Assign POI"
                      open={this.state.assignPOIOpen} 
                      onClose={this.handleAssignPOIClose} 
                      aria_id="Assign-POI"
                      onChange={this.handleChange}
                      rows={[
                        {key: 'id', type: 'text', label: 'id', required: true}
                      ]}
                      onSubmit={this.onAssignPOI} 
                  /> */}
                  </div>
        /* <ReactMap
          style={style}
          center={center}
          movingMethod={'jumpTo'}
          ref={this.mapLocation}
          containerStyle={{
            height: '70vh',
            width: '100vw'}}
          onStyleLoad={this.onStyleLoad}
        >

        <Layer type="symbol"
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
          'text-anchor':            'top',
        }}>

        {
        //  this.state.staticDevices != "" ? this.renderDevices('static') : null
        }
        </Layer>

        <Layer type="circle"  paint={this.getCirclePaint()}>
        {
          this.renderHighlightDevices()
        }
        </Layer>
        <Layer type="symbol"
        id="patientDevices"
        layout={{
          'icon-image':             'marker-15',
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

        <Layer type="symbol"
        id="staffDevices"
        layout={{
          'icon-image':             'hospital-15',
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
          this.renderStaffDevices()
        }
        </Layer>

        <Layer type="symbol"
        id="assetDevices"
        layout={{
          'icon-image':             'suitcase-15',
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
          this.renderAssetDevices()
        }
        </Layer>
        {this.state.map != "" && sourceOptions.url != null ?
        <Source id="image_source" tileJsonSource={sourceOptions} />
        : null}
        {this.state.map != "" && sourceOptions.url != null ?
        <Layer id="image_layer" before="staticDevices" type="raster" sourceId="image_source"/>
        : null}
      </ReactMap> */
    
  )
  }

}
const ConnectedMap = connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Map));

export default ConnectedMap;
