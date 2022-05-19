sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/MultiComboBox',
  ],
  function (
    // prettier 방지용 주석
    MultiComboBox
  ) {
    'use strict';

    return MultiComboBox.extend('sap.ui.yesco.control.SingleComboBox', {
      metadata: {
        properties: {
          selectedKey: { type: 'String' },
        },
      },

      constructor: function (...aArgs) {
        MultiComboBox.apply(this, aArgs);

        this.addStyleClass('mobile-single-combo');
      },

      renderer: {},

      setSelectedKey: function (value) {
        this.setProperty('selectedKeys', _.concat(value), true);
      },

      setSelectedKeys: function (aKeys) {
        MultiComboBox.prototype.setSelectedKeys.apply(this, arguments);

        this.setProperty('selectedKey', _.get(aKeys, 0), true);
      },

      _handleSelectionLiveChange: function (oEvent) {
        MultiComboBox.prototype._handleSelectionLiveChange.apply(this, arguments);

        var oListItem = oEvent.getParameter('listItem');
        var oNewSelectedItem = this._getItemByListItem(oListItem);

        this.setSelectedKeys(_.concat(oNewSelectedItem.getKey()));
      },
    });
  }
);
