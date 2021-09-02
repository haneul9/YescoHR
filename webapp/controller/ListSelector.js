﻿sap.ui.define(
  [
    'sap/base/Log',
    'sap/ui/base/Object', //
  ],
  (Log, BaseObject) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.controller.ListSelector', {
      /**
       * Provides a convenience API for selecting list items. All the functions will wait until the initial load of the a List passed to the instance by the setBoundMasterList
       * function.
       * @class
       * @public
       * @alias sap.ui.yesco.controller.ListSelector
       */
      constructor: function () {
        this._oWhenListHasBeenSet = new Promise((fnResolveListHasBeenSet) => {
          this._fnResolveListHasBeenSet = fnResolveListHasBeenSet;
        });
        // This promise needs to be created in the constructor, since it is allowed to
        // invoke selectItem functions before calling setBoundMasterList
        this.oWhenListLoadingIsDone = new Promise((fnResolve, fnReject) => {
          // Used to wait until the setBound masterList function is invoked
          this._oWhenListHasBeenSet.then((oList) => {
            const items = oList.getBinding('items');

            if (!items) {
              return;
            }

            items.attachEventOnce('dataReceived', () => {
              if (this._oList.getItems().length) {
                fnResolve({
                  list: oList,
                });
              } else {
                // No items in the list
                fnReject({
                  list: oList,
                });
              }
            });
          });
        });
      },

      /**
       * A bound list should be passed in here. Should be done, before the list has received its initial data from the server.
       * May only be invoked once per ListSelector instance.
       * @param {sap.m.List} oList The list all the select functions will be invoked on.
       * @public
       */
      setBoundMasterList(oList) {
        this._oList = oList;
        this._fnResolveListHasBeenSet(oList);
      },

      /**
       * Tries to select and scroll to a list item with a matching binding context. If there are no items matching the binding context or the ListMode is none,
       * no selection/scrolling will happen
       * @param {string} sBindingPath the binding path matching the binding path of a list item
       * @public
       */
      selectAListItem(sBindingPath) {
        this.oWhenListLoadingIsDone.then(
          () => {
            const oList = this._oList;
            let oSelectedItem;

            if (oList.getMode() === 'None') {
              return;
            }

            oSelectedItem = oList.getSelectedItem();

            // skip update if the current selection is already matching the object path
            if (oSelectedItem && oSelectedItem.getBindingContext().getPath() === sBindingPath) {
              return;
            }

            oList.getItems().some((oItem) => {
              if (
                oItem.getBindingContext() &&
                oItem.getBindingContext().getPath() === sBindingPath
              ) {
                oList.setSelectedItem(oItem);
                return true;
              }
            });
          },
          () => {
            Log.warning(
              'Could not select the list item with the path' +
                sBindingPath +
                ' because the list encountered an error or had no items'
            );
          }
        );
      },

      /**
       * Removes all selections from master list.
       * Does not trigger 'selectionChange' event on master list, though.
       * @public
       */
      clearMasterListSelection() {
        //use promise to make sure that 'this._oList' is available
        this._oWhenListHasBeenSet.then(() => {
          this._oList.removeSelections(true);
        });
      },
    });
  }
);
