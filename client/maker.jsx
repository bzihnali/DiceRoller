const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const handleRoll = (e, onRollAdded) => {
    e.preventDefault();
    helper.hideError();

    const rollString = e.target.querySelector('#rollString').value;

    if (!rollString) {
        helper.handleError('All fields are required');
        return false;
    }

    helper.sendPost(e.target.action, { rollstring: rollString }, onRollAdded);
    return false;
};

const RollForm = (props) => {
    return (
        <form id="rollForm"
            onSubmit={(e) => handleRoll(e, props.triggerReload)}
            name="rollForm"
            action="/maker"
            method="POST"
            className="rollForm">

            <label id="instructions" htmlFor="name">A rollstring is a series of dice.<br />
                                                    An example: 4d8+9d[1,2,5]+7d1 would roll 4 8-sided dice, 9 dice with the sides 1, 2, and 5, and 4 1-sided dice (adding 4 to the total value).
                                                    There is a cap on how many total sides the rollstring can have, 2048 [an example would be 64d32.]</label>
            <input id="rollString" type="text" name="name" placeholder="Insert rollstring here" />

            <input className="makeRollSubmit" type="submit" value="Add Roll" />
        </form>
    );
};

const RollList = (props) => {
    const [rolls, setRolls] = useState(props.rolls);

    useEffect(() => {
        const loadRollsFromServer = async () => {
            const response = await fetch('/getRolls');
            const data = await response.json();
            setRolls(data.rolls.reverse());
        };
        loadRollsFromServer();
    }, [props.reloadRolls]);

    if (rolls.length === 0) {
        return (
            <div className="rollList">
                <h3 className="emptyRoll">No Rolls Yet!</h3>
            </div>
        );
    }

    const rollNodes = rolls.map(roll => {
        return (
            <div key={roll.id} className="roll">
                <h3 className="rollName">{roll.rollstring.replace(/\+/g, ' + ')}</h3>
                <button className="rollDiceButton" onClick={(e) => {
                    props.generateRollResults(roll._id).then(props.triggerReload);
                }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M274.9 34.3c-28.1-28.1-73.7-28.1-101.8 0L34.3 173.1c-28.1 28.1-28.1 73.7 0 101.8L173.1 413.7c28.1 28.1 73.7 28.1 101.8 0L413.7 274.9c28.1-28.1 28.1-73.7 0-101.8L274.9 34.3zM200 224a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM96 200a24 24 0 1 1 0 48 24 24 0 1 1 0-48zM224 376a24 24 0 1 1 0-48 24 24 0 1 1 0 48zM352 200a24 24 0 1 1 0 48 24 24 0 1 1 0-48zM224 120a24 24 0 1 1 0-48 24 24 0 1 1 0 48zm96 328c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-114.3 0c11.6 36 3.1 77-25.4 105.5L320 413.8l0 34.2zM480 328a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" /></svg></button>
                <button className="deleteDiceButton" onClick={(e) => {
                    props.deleteRoll(roll._id).then(props.triggerReload);
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                </button>
            </div>
        );
    });

    return (
        <div className="rollList">
            {rollNodes}
        </div>
    );
};

export default function RollDistributionChart({ diceRolls, highlightValue, mean, quartiles, tenths }) {
    // Transform dataMap (object) into labels and values
    const labels = Object.keys(diceRolls).map(Number).sort((a, b) => a - b).map(String);
    const values = labels.map(label => diceRolls[label]);

    // Build dynamic bar colors: highlight the one matching highlightValue
    const backgroundColors = labels.map((label) => {
        let rollCount = Object.keys(diceRolls).length;
        if (Number(label) === Number(highlightValue)) {
            return 'rgba(255, 99, 132, 0.8)'
        } else {
            if (rollCount >= 10) {
                if (Number(label) === Math.ceil(Number(mean))) {
                    return 'rgba(255, 207, 32, 0.8)'
                }
            }
            if (rollCount >= 25) {
                if (quartiles.includes(Number(label))) {
                    return 'rgba(255, 239, 99, 0.8)'
                }
            }
            if (rollCount >= 50) {
                if (tenths.includes(Number(label))) {
                    return 'rgba(203, 255, 99, 0.8)'
                }
            }
            return 'rgba(85, 208, 227, 0.81)'
        }
    }
    );

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Dice Roll Outcomes',
                data: values,
                backgroundColor: backgroundColors,
            },
        ],
    };

    const options = {
        animation: {
            duration: 0
        },
        responsive: true,
        scales: {
            y: {
                display: false,
                beginAtZero: true,
                title: {
                    display: false,
                    text: 'Count',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Roll Total',
                },
                ticks: {
                    maxTicksLimit: 20, // Prevent clutter on x-axis
                },
            },
        },
        plugins: {
            title: {
                display: true,
                text: 'Dice Roll Distribution',
            },
            legend: {
                display: false,
            },
        },
    };

    return <Bar data={chartData} options={options} />;
}

const RollResults = ({ rollData, showPremium, togglePremium }) => {
    if (!rollData) return null;

    return (
        <div id="results">
            <h2 id="main-result">Your roll was...</h2>
            <h1 id="final-roll"><b>{rollData.rollTotal}</b></h1>
            <h3 id="roll-numbers">Dice Values: {rollData.rolls.join(', ')}</h3>

            <div id="premium-output" className={showPremium ? "" : "hidden"}>
                <h3 id="roll-statistics">
                    Your roll was better than {Math.round(100 * rollData.rollPercentile) / 100}% of all possible rolls!<br />
                    Avg. Roll: {rollData.rollMean}<br />
                    10% Roll: {rollData.rollTenths[0]}<br />
                    25% Roll: {rollData.rollQuartiles[0]}<br />
                    75% Roll: {rollData.rollQuartiles[1]}<br />
                    90% Roll: {rollData.rollTenths[1]}
                </h3>
                <RollDistributionChart
                    diceRolls={rollData.rollPMF}
                    highlightValue={rollData.rollTotal}
                    mean={rollData.rollMean}
                    quartiles={rollData.rollQuartiles}
                    tenths={rollData.rollTenths}
                />
            </div>

            <button id="togglePremium" onClick={togglePremium}>
                Click to try Premium free!
            </button>
        </div>
    );
};


const App = () => {
    const [reloadRolls, setReloadRolls] = useState(false);
    const [rollData, setRollData] = useState(null); 
    const [showPremium, setShowPremium] = useState(false);

    const handleGenerateRollResults = async (id) => {
        await helper.sendPost('/generateRollResults', { id }, (json) => {
            setRollData(json);
        });
    };

    return (
        <div id="mainContainer">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
            <div id="rollInputs">
                <div id="makeRoll">
                    <RollForm triggerReload={() => { setReloadRolls(!reloadRolls) }} />
                </div>
                <div id="rolls">
                    <RollList
                        rolls={[]}
                        triggerReload={() => { setReloadRolls(!reloadRolls) }}
                        reloadRolls={reloadRolls}
                        deleteRoll={async (id) => { await helper.sendPost('/delete', { id }) }}
                        generateRollResults={handleGenerateRollResults}
                    />
                </div>
            </div>

            <RollResults
                rollData={rollData}
                showPremium={showPremium}
                togglePremium={() => setShowPremium(!showPremium)}
            />
        </div>
    );
};


const init = () => {
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
};

window.onload = init;
