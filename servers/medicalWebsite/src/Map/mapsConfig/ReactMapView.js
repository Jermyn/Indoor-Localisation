import React, { Component } from 'react'
import _ from 'underscore'
import ReactMapboxGl, { Layer } from 'react-mapbox-gl'
import mapboxgl from 'mapbox-gl'



class ReactMapView extends Component {
  constructor(props) {
    super(props);
    this.Map = ReactMapboxGl(props)
    this.state = {
      center: [0, 0],
      map: '',
      sourceOptions: {}
    }
  };

  componentDidMount() {
    window.addEventListener('resize', this._resize);
    //this._resize();
    if(this.props.map != null) {
      this.initializeMap(this.props.map);
    }
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
    
}

  initializeMap = (map, jump) => {
    console.log(map)
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

_resize = () => {
  this.setState({
      viewport: {
      ...this.state.viewport,
      width: '100vw',
      height: '100vh'
      }
  });
};


  render() {
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
      <this.Map
        style={style}
        ref={this.mapLocation}
        center={center}
        movingMethod={'jumpTo'}
        containerStyle={{
            height: '100vh',
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
        </this.Map>
    )
  }
}

export default ReactMapView
