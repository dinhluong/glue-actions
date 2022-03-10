AWS.config.region =  _config.cognito.region; // Region
var data = { 
    UserPoolId : _config.cognito.userPoolId,
    ClientId : _config.cognito.clientId
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
var cognitoUser = userPool.getCurrentUser();

window.onload = function(){
if (cognitoUser != null) {
    cognitoUser.getSession(function(err, session) {
        if (err) {
            alert(err);
            return;
        }
        console.log('session validity: ' + session.isValid());
        $("#user-name").text('ユーザ: '+cognitoUser.username);
        let _url = 'cognito-idp.'+_config.cognito.region+'.amazonaws.com/' + _config.cognito.userPoolId;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: _config.cognito.identityPoolId,
            Logins: {
                [_url]: session.getIdToken().getJwtToken()
            }
        });
    });
}
}
function signOut(){
    if (cognitoUser != null) {
      cognitoUser.signOut();
      window.location.href = "signout.html";
    }
}

function runJob(){
    let shain = $('#shain-bango').val()
    let phase = $('#phase').val()
    console.log(phase);
    if (phase == 'predata-generate'){
        
        let glue = new AWS.Glue({region: 'ap-northeast-1'});
        var params = {
        JobName: 'predata-generate', /* required */
        Arguments: {
            "--phase":phase,
            "--shain":shain
          }
        };
        let request =  glue.startJobRun(params);
        request.send(function(err, data) {
             if (err){
                console.log(err, err.stack);
                $('#alert-danger-msg').text(err);
                $('#alert-danger').removeClass('invisible');
                
             }
             else{
                $('#alert-success-msg').text('正常に実行できました。');
                $('#alert-success').removeClass('invisible');
                console.log(data);
                var newRowContent = "<tr><td>"+data.JobRunId+"<td><button type=\"button\" class=\"btn btn-primary\" onclick=\"viewLog('"+data.JobRunId+"')\">ログ見る</button></td></tr>";
                $("#tbl-job tbody").append(newRowContent);
                $('#tbl-job').removeClass('invisible');  
             }
           });
         }
    else{
        console.log(shain);
    }
        
}


function viewLog(jobId){
    let cloudwatchlogs = new AWS.CloudWatchLogs();
    var params = {
        logGroupName: '/aws-glue/python-jobs/output', /* required */
        logStreamName: jobId, /* required */
      };
      let request =  cloudwatchlogs.getLogEvents(params)
      request.send(function(err, data) {
        if (err) {
            $('#alert-danger-msg').text(err);
            $('#alert-danger').removeClass('invisible');
            console.log(err, err.stack); // an error occurred
        }
        else{
            let logs =  parseLogs(data)
            var w = window.open('about:blank');
            w.document.open();
            w.document.write(logs);
            w.document.close();
        }     
      });
    
}
function parseLogs(data){
    let logs = '';
    $.each(data.events,function(i,ev){
        let date = new Date(ev.timestamp)
        logs += (date +"&nbsp;&nbsp;&nbsp;&nbsp;"+ ev.message + '<br>');
    });
    return logs;
}