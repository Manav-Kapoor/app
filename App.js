import React from 'react';
import Outer from './views/outer';
import {BrowserRouter, Route} from 'react-router-dom';
import Web3 from 'web3';
import {abi, contractaddress} from './web3';
import AdminDashboard from './views/AdminDashboard';
import Offers from './views/offers';
import AddRecord from './views/addRecord';

class Application extends React.Component{
  constructor(props){
    super(props);
    this.loadBlockchainData();
  }
  loadBlockchainData = async () => {
    var web3;
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
        // Request account access if needed
        await window.ethereum.enable();
        // Acccounts now exposed
        } catch (error) {
        console.error(error);
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        // Use Mist/MetaMask's provider.
        web3 = window.web3;
        console.log('Injected web3 detected.');
    }
    // Fallback to localhost; use dev console port by default...
    else {
        const provider = new Web3.providers.WebsocketProvider('http://127.0.0.1:7545');
        web3 = new Web3(provider);
        console.log('No web3 instance injected, using Local web3.');
    }    

    var account = await web3.eth.getAccounts();
    account = account[0];
    var contract = new web3.eth.Contract(abi, contractaddress);
    console.log(contract);

    var receipt = await contract.methods.make_admin('owner@gmail.com', 'owner@1234').send({from:account});
    console.log(receipt);

    window.w3getcontractbalance = function() {
      console.log("CALLED FUNCTION: w3getcontractbalance with param:" + contractaddress);
      
      var result = web3.fromWei(web3.eth.getBalance(contractaddress));
    
      return(result) ; 
    }
    window.w3registerUser = async function(name, email, password, age){
      console.log("Called function registerUser");
      try{
        const check = await contract.methods.is_email_unique(email).call();
        if(check == true){
          await contract.methods.registerPatient(account, name, email, age, password).send({from: account});
          var obj = await contract.methods.patient_detail(email).call();
          console.log(obj);
          var patient = {
            age: obj.ageret,
            coverage_left: parseInt(obj.coverage_leftret),
            email: obj.emailret,
            name: obj.nameret,
            address: obj.patAddrret,
            recordCount: obj.recordountret,
            expiry: "Expired"
          };
          return patient;
        }
      }catch(e){
        console.log(e.message);
      }
    }
    window.w3loginUser = async function(email, password){
      console.log("Called function loginUser");
      try{
        const inter = await contract.methods.authenticate(email, password).call();
        console.log(inter);
        var check = inter.auth;
        var str = inter.role;
        if(check == true){
          if(str == "admin"){
            console.log("HI");
            
            return {role: "admin"};
          }else if(str == "patient"){
            var objPatient = await contract.methods.patient_detail(email).call();
            console.log(objPatient);
            var differenceDates = (new Date().getTime()) - (new Date(objPatient.payment_date * 1000).getTime());
            differenceDates = differenceDates/(1000 * 3600 * 24);
            console.log(differenceDates);
            var isExpired = differenceDates > 365 ? true: false;
            var patient = {};
            if(isExpired){
              console.log('Hi');
              await contract.methods.expired_patient(email);
              var newobjPatient = await contract.methods.patient_detail(email).call();
              patient = {
                age: newobjPatient.ageret,
                coverage_left: parseInt(newobjPatient.coverage_leftret),
                email: newobjPatient.emailret,
                name: newobjPatient.nameret,
                address: newobjPatient.patAddrret,
                recordCount: newobjPatient.recordcountret,
                expiry: "Expired",
                role: "patient"
              };
            }else{
              patient = {
                age: objPatient.ageret,
                coverage_left: parseInt(objPatient.coverage_leftret),
                email: objPatient.emailret,
                name: objPatient.nameret,
                address: objPatient.patAddrret,
                recordCount: objPatient.recordcountret,
                expiry: new Date(objPatient.payment_dateret*1000),
                role:"patient"
              };
            }
            console.log(patient);
            return patient;
          }else if(str == "hospital"){
            var objHospital = await contract.methods.Hospital_detail(email).call();
            var hospital = {
              email: objHospital.email,
              name: objHospital.namehosp,
              address: objHospital.hospitaladdresshosp,
              location: objHospital.locationhosp,
              recordCount: objHospital.recordounthosp,
              role:"hospital"
            };
            return hospital;
          }
        }
      }catch(e){
        console.log(e.message);
      }
    }
  }
  render(){
    return(
      <BrowserRouter>
        <Route path='/' exact component={Outer}/>
        <Route path='/offers' component={Offers}/>
        <Route path='/addrecord' component={AddRecord}/>
      </BrowserRouter>
    )
  }
}


export default Application;
