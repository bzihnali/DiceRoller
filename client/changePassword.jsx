const helper = require('./helper.js');
const React = require('react');
const { createRoot } = require('react-dom/client');

const handleChangePass = (e) => {
    e.preventDefault();
    helper.hideError();

    const pass = e.target.querySelector('#pass').value;
    const pass2 = e.target.querySelector('#pass2').value;

    if (!pass || !pass2) {
        helper.handleError('All fields are required!');
        return false;
    }

    if (pass === pass2) {
        helper.handleError('New password can\'t be old password!');
        return false;
    }

    console.log(e.target.action)
    helper.sendPost(e.target.action, { oldPass: pass, newPass: pass2 });

    return false;
}

const ChangePassWindow = (props) => {
    return (
        <form id="changePassForm"
            name="changePassForm"
            onSubmit={handleChangePass}
            action="/changePassword"
            method="POST"
            className="mainForm"
        >
            <label htmlFor="pass">Old Password: </label>
            <input id="pass" type="password" name="pass" placeholder="password" />

            <label htmlFor="pass2">New Password: </label>
            <input id="pass2" type="password" name="pass2" placeholder="new password" />

            <input className="formSubmit" type="submit" value="Change Password" />
        </form>
    );
};

const init = () => {
    const root = createRoot(document.getElementById('content'));

    root.render(<ChangePassWindow />);
};

window.onload = init;

