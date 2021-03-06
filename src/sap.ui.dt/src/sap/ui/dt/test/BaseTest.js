/*!
 * ${copyright}
 */

// Provides class sap.ui.dt.test.Test.
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/base/ManagedObject'
],
function(jQuery, ManagedObject) {
	"use strict";

	/**
	 * Constructor for an Test.
	 *
	 * @param {string} [sId] id for the new object, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new object
	 *
	 * @class
	 * The Test class allows to create design time tests.
	 * @extends sap.ui.base.ManagedObject
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @private
	 * @since 1.48
	 * @alias sap.ui.dt.test.Test
	 * @experimental Since 1.48. This class is experimental and provides only limited functionality. Also the API might be changed in future.
	 */
	var BaseTest = ManagedObject.extend("sap.ui.dt.test.BaseTest", /** @lends sap.ui.dt.test.BaseTest.prototype */ {
		metadata : {
			"abstract" : true
		}
	});

	/**
	 * @type {map} Status Enum. Provides all availabe status.
	 * @static
	 */
	BaseTest.STATUS = {
		"SUPPORTED" : {
			key: "SUPPORTED",
			text: "supported",
			value: 3
		},
		"PARTIAL_SUPPORTED" : {
			key: "PARTIAL_SUPPORTED",
			text: "partial supported",
			value: 2
		},
		"NOT_SUPPORTED" : {
			key: "NOT_SUPPORTED",
			text: "not supported",
			value: 1
		},
		"ERROR" : {
			key: "ERROR",
			text: "error",
			value: 0
		},
		"UNKNOWN" : {
			key: "UNKNOWN",
			text: "unknown",
			value: 0
		}
	};

	/**
	 * @type {map} Type Enum. Provides all availabe types.
	 * @static
	 */
	BaseTest.TYPE = {
		"TEST" : "Test",
		"GROUP" : "Group",
		"SUITE" : "Suite"
	};


	/**
	 * Creates a new suite and returns it.
	 *
	 * @param {string} sName The name of the suite.
	 * @return {map} the entry object
	 *
	 * @protected
	 */
	BaseTest.prototype.createSuite = function(sName) {
		return this.add(
			null,
			false,
			sName,
			null,
			BaseTest.TYPE.SUITE
		);
	};


	/**
	 * Adds a new group to an array.
	 *
	 * @param {object[]} aParentChildren the array to insert the group
	 * @param {string} sName The name of the group.
	 * @return {map} the entry object
	 *
	 * @protected
	 */
	BaseTest.prototype.addGroup = function(aParentChildren, sName) {
		return this.add(aParentChildren,
			true,
			sName,
			null,
			BaseTest.TYPE.GROUP
		);
	};


	/**
	 * Adds a new test to an array.
	 *
	 * @param {object[]} aParentChildren the array to insert the test
	 * @param {boolean} bResult The result of the test.
	 * @param {string} sName The name of the test.
	 * @param {map} status The status of the test.
	 * @return {map} the entry object
	 *
	 * @protected
	 */
	BaseTest.prototype.addTest = function(aParentChildren, bResult, sName, mStatus) {
		return this.add(aParentChildren,
			bResult,
			sName,
			mStatus,
			BaseTest.TYPE.TEST
		);
	};


	/**
	 * Adds a new entry to an array.
	 *
	 * @param {object[]} aParentChildren the array to insert the entry
	 * @param {boolean} bResult The result of the entry.
	 * @param {string} sName The name of the entry.
	 * @param {map} mStatus The status of the entry.
	 * @param {string} sType The type of the entry.
	 * @return {map} the entry object
	 *
	 * @protected
	 */
	BaseTest.prototype.add = function(aParentChildren, bResult, sName, mStatus, sType) {

		if (!mStatus) {
			if (bResult) {
				mStatus = BaseTest.STATUS.SUPPORTED;
			} else {
				mStatus = BaseTest.STATUS.NOT_SUPPORTED;
			}
		}

		var mEntry = {
			name : sName,
			result : bResult,
			status : mStatus,
			type : sType,
			statistic : {},
			children : []
		};

		if (aParentChildren) {
			aParentChildren.push(mEntry);
		}

		return mEntry;
	};


	/**
	 * Runs the tests.
	 *
	 * @public
	 */
	BaseTest.prototype.run = function() {
		throw new Error("Abstract method");
	};


	/**
	 * Aggregates the tests results.
	 * @return {map} the aggregated result
	 *
	 * @protected
	 */
	BaseTest.prototype.aggregate = function(mResult) {
		if (mResult.type != BaseTest.TYPE.TEST && mResult.children.length > 0) {
			var aChildren = mResult.children;

			var aMappedResult = aChildren.map(function(mEntry) {
				var mChildResult = this.aggregate(mEntry);
				return {
					result : mChildResult.result,
					status : mChildResult.status
				};
			}, this);

			if (aMappedResult.length == 1) {
				aMappedResult.push(aMappedResult[0]);
			}

			var mReducedResult = aMappedResult.reduce(function(mPreviousValue, mCurrentValue) {
				return {
					result : this._getResult(mPreviousValue, mCurrentValue),
					status : this._getStatus(mPreviousValue, mCurrentValue),
					statistic : this._getStatistic(mPreviousValue, mCurrentValue)
				};
			}.bind(this));


			mResult.result = mReducedResult.result;
			mResult.status = mReducedResult.status;
			mResult.statistic = mReducedResult.statistic;
		}

		return mResult;
	};


	/**
	 * @private
	 */
	BaseTest.prototype._getResult = function(mPreviousValue, mCurrentValue) {
		return !mPreviousValue.result ? false : mCurrentValue.result;
	};


	/**
	 * @private
	 */
	BaseTest.prototype._getStatus = function(mPreviousValue, mCurrentValue) {
		return mPreviousValue.status.value < mCurrentValue.status.value ? mPreviousValue.status : mCurrentValue.status;
	};

	/**
	 * @private
	 */
	BaseTest.prototype._getStatistic = function(mPreviousValue, mCurrentValue) {
		var mStatistic = this._getStatisticObjectForEntry(mPreviousValue);
		if (mPreviousValue !== mCurrentValue) {
			mStatistic[mCurrentValue.status.key]++;
		}
		return mStatistic;
	};


	/**
	 * @private
	 */
	BaseTest.prototype._getStatisticObjectForEntry = function(mEntry) {
		var mStatistic = {};

		if (!mEntry.statistic) {
			for (var sStatus in BaseTest.STATUS) {
				mStatistic[sStatus] = 0;
			}
			mStatistic[mEntry.status.key]++;
		} else {
			mStatistic = mEntry.statistic;
		}

		return mStatistic;
	};

	return BaseTest;
}, /* bExport= */ true);