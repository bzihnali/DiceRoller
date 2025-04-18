const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

const handleDie = (e, onDieAdded) => {
    e.preventDefault();
    helper.hideError();

    const name = e.target.querySelector('#dieName').value;
    const age = e.target.querySelector('#dieAge').value;
    const level = e.target.querySelector('#dieLevel').value;

    if (!name || !age || !level) {
        helper.handleError('All fields are required');
        return false;
    }

    helper.sendPost(e.target.action, { name, age, level }, onDieAdded);
    return false;
};

const DieForm = (props) => {
    return (
        <form id="dieForm"
            onSubmit={(e) => handleDie(e, props.triggerReload)}
            name="dieForm"
            action="/maker"
            method="POST"
            className="dieForm">

            <label htmlFor="name">Name: </label>
            <input id="dieName" type="text" name="name" placeholder="Die Name" />

            <label htmlFor="age">Age: </label>
            <input id="dieAge" type="number" min="0" name="age" />

            <label htmlFor="level">Level: </label>
            <input id="dieLevel" type="number" min="0" name="level" />

            <input className="makeDieSubmit" type="submit" value="Make Die" />
        </form>
    );
};

const DieList = (props) => {
    const [dice, setDice] = useState(props.dice);

    useEffect(() => {
        const loadDiceFromServer = async () => {
            const response = await fetch('/getDice');
            const data = await response.json();
            setDice(data.dice);
        };
        loadDiceFromServer();
    }, [props.reloadDice]);

    if (dice.length === 0) {
        return (
            <div className="dieList">
                <h3 className="emptyDie">No Dice Yet!</h3>
            </div>
        );
    }

    const dieNodes = dice.map(die => {
        return (
            <div key={die.id} className="die">
                <img src="/assets/img/dieface.jpeg" alt="die face" className="dieFace" onClick={(e) => {
                    props.deleteDie(die._id).then(props.triggerReload);
                    
                }}/>
                <h3 className="dieName">Name: {die.name}</h3>
                <h3 className="dieAge">Age: {die.age}</h3>
                <h3 className="dieLevel">Level: {die.level ?? 1}</h3>
            </div>
        );
    });

    return (
        <div className="dieList">
            {dieNodes}
        </div>
    );
};

const App = () => {
    const [reloadDice, setReloadDice] = useState(false);

    return (
        <div>
            <div id="makeDie">
                <DieForm triggerReload={() => {setReloadDice(!reloadDice)}} />
            </div>
            <div id="dice">
                <DieList dice={[]} triggerReload={() => {setReloadDice(!reloadDice)}} reloadDice={reloadDice} deleteDie={
                    async (id) => {
                        await helper.sendPost('/delete', { "id": id })
                    }
                } />
            </div>
        </div>
    );
};

const init = () => {
    const root = createRoot(document.getElementById('app'));
    root.render(<App />);
};

window.onload = init;
