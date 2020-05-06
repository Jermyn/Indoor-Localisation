import React from "react";
import Quagga from 'quagga';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  drawingBuffer: {
    display: 'none'
  },
  textField: {
    // marginLeft: theme.spacing.unit,
    // marginRight: theme.spacing.unit,
  },
  borderBox: {
    border: '1px solid',
    padding: '2rem',
    borderRadius: '16px',
  },
  menu: {
    width: 200,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
    opacity : 0.4,
    color: 'black',
  },
  align: {
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
  }
});

class Scanner extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          source: ''
        }
    }

    handleVideo = (stream) => {
   // this.setState({
   //   source: stream
   // })
 }

 videoError = (err) => {
   console.log(err)
 }

    render() {
        return (
            <div id="interactive" className="viewport" style={{textAlign: 'center'}}>
              <video  className="videoCamera" autoPlay={true} preload="auto" src="" muted="true"
             playsInLine ></video>

             <canvas className="drawingBuffer" style={{display: 'none'}}></canvas>
           </div>
        );
    }

    componentDidMount() {

        Quagga.init({
            inputStream: {
                type : "LiveStream",
                constraints: {
                    width: 500,
                    height: 480,
                    facingMode: "environment", // or user
                }
            },
            locator: {
                patchSize: "large",
                halfSample: true
            },
            numOfWorkers: 4,
            decoder: {
                readers : ["code_128_reader", "code_39_reader"]
            },
            locate: true
        }, function(err) {
            if (err) {
                return console.log(err);
            }


            // const drawingCanvas = Quagga.canvas.dom.overlay;
            // drawingCanvas.style.display = 'none';
            Quagga.start();
        });

        Quagga.onDetected(this._onDetected);
    }

    componentWillUnmount() {
        Quagga.offDetected(this._onDetected);
        Quagga.stop();
    }

    _onDetected = (result) => {
      const drawingCanvas = Quagga.canvas.dom.overlay;
        drawingCanvas.style.display = 'none';
        this.props.onDetected(result);
    }
};

Scanner.propTypes = {
    onDetected: PropTypes.func.isRequired
};

export default withStyles(styles)(Scanner);
