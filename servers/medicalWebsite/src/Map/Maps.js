import React, { Component } from 'react'
import _ from 'underscore'
import Promise from 'bluebird'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import MapsPanel from './mapsConfig/MapsPanel'
// import Actions from '../store/actions/actions'
import { featureCollection } from '@turf/helpers'
import length  from '@turf/length'
import mapboxgl from 'mapbox-gl'
// import MaterialDialogForm from '../components/addDevices/MaterialDialogForm'
import LoadMap from './mapsFunction/maps'

function packageMap ({id, image, scale, coordinates}) {
  var obj;
  obj = {};
  if (id) {
    obj.id = id;
  }
  if (image) {
    obj.image = image;
  }
  if (scale) {
    obj.scale = parseFloat(scale);
  }
  if (coordinates) {
    obj.coordinates = coordinates;
  }
  return obj;
}

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

class Maps extends Component {
    constructor(props) {
        super(props);
        this.mapView = React.createRef();
        this.state = {
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
            mapView: null
        };
    };
    

    componentDidMount() {
        const { actions } = this.props;
        actions.maps.fetch()
        actions.devices.fetch()
    }

    onCreateMap = () => {
        const mapView = this.mapView.current;
        const { actions } = this.props;
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
        // const { actions, currentMap } = this.props;
        // actions.maps.update({
        //     id: currentMap.id,
        //     scale: this.state.scale
        // })
        this.setState({ editMapOpen: false })
    }

    onDeleteMap = () => {
        // const { actions, currentMap } = this.props;
        // actions.maps.delete(currentMap.id)
        // actions.devices.fetch()
        this.setState({ deleteMapOpen: false })
    }

    onLoadMap = (e, res) => {
        // const { actions } = this.props;
        e.preventDefault();
        // actions.maps.load(res)
        this.setState({ loadMapOpen: false })
    }

    onMeasure = () => {
        const mapView = this.mapView.current;
        var lines = mapView.getSelected().features.filter(function({geometry}) {
            return geometry.type === 'LineString';
          })
        this.setState({
            measuredRadians: length(lines[0], {units: 'degrees'}).toString(),
            measuredOpen: true
        })
    }

    onAssignStaticDevices = (e, id) => {
        const mapView = this.mapView.current;
        const { actions, currentMap } = this.props;
        _(mapView.getSelected().features).first(1).filter(function({geometry}) {
            return geometry.type === 'Point';
          }).forEach(function(x) {
            return actions.devices.update({
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

    onAssignNavMesh = () => {
        const mapView = this.mapView.current;
        const { actions, currentMap } = this.props;
        var current = mapView.getAll().features.filter(function({properties}) {
            return (properties != null ? properties.type : void 0) === 'nav-mesh';
          });
          
        var selected = mapView.getSelected().features.filter(function({geometry}) {
            return geometry.type === 'Polygon';
            }).map(function(x) {
            return Object.assign(x, {
                properties: {
                type: 'nav-mesh'
                }
            });
        });
        actions.maps.update({
            id: currentMap.id,
            navMesh: featureCollection(_.flatten([current, selected]))
        });
    }

    onAssignNavPath = () => {
        const mapView = this.mapView.current;
        const { actions, currentMap } = this.props;
        var current = mapView.getAll().features.filter(function({properties}) {
            return (properties != null ? properties.type : void 0) === 'nav-path';
          });
        var selected = mapView.getSelected().features.filter(function({geometry}) {
            return geometry.type === 'LineString';
        }).map(function(x) {
            return Object.assign(x, {
              properties: {
                type: 'nav-path'
              }
            });
        });
          
        actions.maps.update({
            id: currentMap.id,
            navPath: featureCollection(_.flatten([current, selected]))
        });
    }

    onAssignPOI = (e, id) => {
        const mapView = this.mapView.current;
        const { actions, currentMap } = this.props;
        var current = mapView.getAll().features.filter(function({properties}) {
            return (properties != null ? properties.type : void 0) === 'poi';
          });
        var selected = typeof id !== "undefined" && id !== null ? mapView.getSelected().features.filter(function({geometry}) {
            return geometry.type === 'Point';
        }).map(function(x) {
            return Object.assign(x, {
              properties: {
                type: 'poi',
                title: id,
                id
              }
            });
        }) : [];
          
        actions.maps.update({
            id: currentMap.id,
            pois: featureCollection(_.flatten([current, selected]))
        });
        this.setState({ assignPOIOpen: false })
    }

    onEditFeatures = (features) => {
        const { actions, currentMap } = this.props;
        //edit NavPath
        _.chain(features).filter(function({properties}) {
            return (properties != null ? properties.type : void 0) === 'nav-path';
        }).first(1).each(() => {
            return this.onAssignNavPath({
                id:null
            });
        });
        //edit NavMesh
        _.chain(features).filter(function({properties}) {
            return (properties != null ? properties.type : void 0) === 'nav-mesh';
        }).first(1).each(() => {
            return this.onAssignNavMesh({
                id:null
            });
        });
        // edit poi
        _.chain(features).filter(function({properties}) {
            return (properties != null ? properties.type : void 0) === 'poi';
        }).first(1).each(() => {
            return this.onAssignPOI({
            id: null
            });
        });
  
        // edit static devices
        Promise.map(features.filter(function({properties}) {
            var ref;
            return ((ref = properties.device) != null ? ref.id : void 0) != null;
        }), function({properties, geometry}) {
            return actions.devices.update({
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
        const { actions } = this.props;
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
            return actions.devices.update({
            device: {
                id: id,
                location: null
            }
            });
        });
    }

    handleLoadClose = () => {
        this.setState({ loadMapOpen: false });
    };

    handleLoadOpen = () => {
        this.setState({ loadMapOpen: true });
    };

    handleChange = (e) => {
        console.log(e)
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


    

    render() {
        const { currentMap, featureCollection } = this.props;
        // console.log (this.props)
        return (
            <div>
                <MapsPanel
                    onLoad={this.handleLoadOpen}
                    onCreate={this.handleCreateOpen}
                    onSave={this.onSave}
                    onEdit={this.handleEditOpen}
                    // onDelete={this.handleDeleteOpen}
                    onMeasure={this.onMeasure}
                    onAssignStaticDevice={this.handleAssignDevOpen}
                    onAssignPOI={this.handleAssignPOIOpen}
                    // onAssignNavPath={this.onAssignNavPath}
                    // onAssignNavMesh={this.onAssignNavMesh}
                />
                <LoadMap
                    ref={this.mapView}
                    map={currentMap}
                    featureCollection={featureCollection}
                    onEditFeatures={this.onEditFeatures}
                    onDeleteFeatures={this.onDeleteFeatures}
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
                />
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
                <MaterialDialogForm
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
    )}
}

const mapStateToProps = (state) => {
    return {
        // staticDevices: state.staticDevices,
        // maps: state.maps.maps,
        currentMap: state.currentMap,
        featureCollection: state.featureCollection
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Maps))
  


