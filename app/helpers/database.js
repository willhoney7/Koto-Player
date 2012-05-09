//Not used
//var sqlDb =  new Database('KotoPlayer_db', '1');
/*
 * Database Class 
 * 
 * Class written by Brad Ball
 * http://www.bradball.net
 * development@bradball.net
 *
 * This class is freely distributable as
 * long as this comment block is included
 * in full.
 * 
 * CLASS USAGE:
 * ============
 * 
 * -- INSTANTIATE A DATABASE OBJECT
 * myDb = new Database(string name, string version, [int size]);
 * 
 * -- RUN A SINGLE QUERY
 * myDb.runQuery(sql, [this.mySuccessCallback.bind(this)], [this.myFailCallback.bind(this)]);
 * 
 * -- RUN A QUERY BATCH
 * var sql = [];
 * sql.push("first sql statement");
 * sql.push("2nd sql statement");
 * sql.push("3rd sql statement");
 * 
 * myDb.runBatch(sql, [this.mySuccessCallback.bind(this)], [this.myFailCallback.bind(this)]);
 * 
 * 
 * -- SETUP CALLBACKS
 * prototype.mySuccessCallback = function(results) {
 * 	 // ... results parameter contains the query results object
 * }
 * 
 * prototype.myFailCallback = function(error) {
 *   // ... error parameter contains "code" and "message" properties
 *   //     error.code
 *   //     error.message
 * }
 * 
 */

function Database(dbName, dbVersion, showErrors, dbSize) {
	this.name = dbName;
	this.version = dbVersion;

	if (dbSize === null)
		dbSize = 65536;
		
	if (showErrors === null)
		showErrors = false;

	this.showErrorDialog = showErrors;
	this.size = dbSize;

	this.db = openDatabase(this.name, this.version, this.size);
}

Database.prototype.executeHandler = function(callback, transaction, results) {
	//PUT CODE HERE TO BE EXECUTED EACH TIME A QUERY IS SUCCESSFUL.



	//Don't modify this, or your callback will not be called.
	if (callback)
		callback(results);
}

Database.prototype.errorHandler = function(callback, transaction, error) {
	this.logError(error, "A database error occured. " + error.message);
	
	//PUT CODE HERE TO BE EXECUTED EACH TIME A QUERY FAILS.




	//Don't modify this, or your callback will not be called.
	if (callback)
		callback(error);
}

Database.prototype.runQuery = function(sql, successCallback, failCallback) {
	try {
	    this.db.transaction( 
	        (function (transaction) { 
	            transaction.executeSql(sql, [], this.executeHandler.bind(this, successCallback), this.errorHandler.bind(this, failCallback)); 
	        }).bind(this) 
	    );
	}
	catch (e)
	{
		this.logError(e, "Error running query: " + sql);
	}	
}

Database.prototype.runBatch = function(sql, successCallback, failCallback) {
	var i = -1;
	try {
	    this.db.transaction( 
	        (function (transaction) { 
				for (i=0; i< sql.length; i++) {
					if (i < sql.length - 1) 
						transaction.executeSql(sql[i], []); 
					else
						transaction.executeSql(sql[i], [], this.executeHandler.bind(this, successCallback), this.errorHandler.bind(this, failCallback)); 					
				}
	        }).bind(this) 
	    );
	}
	catch (e)
	{
		this.logError(e, "error running query batch. Query index: " +  i);
	}	
}

Database.prototype.logError = function(logError, displayMsg) {
	if (this.showErrorDialog && displayMsg != null) //handle optional parameter
		Mojo.Controller.errorDialog(displayMsg);
	Mojo.Log.logException(logError, displayMsg);
}