import React from 'react'
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import AccelerationChart from './AccelerationChart';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HealthChart from './HealthChart';

function liveDisplay(props) {
    const { acc, hr } = props;
    return (
        <div>
            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="subtitle1" gutterBottom>Acceleration</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div style={{width: '100%'}}>
                        {/* {page.push('/acceleration')} */}
                        <AccelerationChart acc={acc}/>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="subtitle1" gutterBottom>Heart Rate</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div style={{width: '100%'}}>
                        {/* {page.push('/acceleration')} */}
                        <HealthChart hr={hr}/>
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        </div>
    )
}

export default liveDisplay;
