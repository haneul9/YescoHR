sap.ui.define(
  [
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AttachFileAction',
  ], (
    Fragment,
    AttachFileAction,
  ) => {
  'use strict';

  return {
    /**
     * Rounds the currency value to 2 digits
     *
     * @public
     * @param {string} sValue value to be formatted
     * @returns {string} formatted currency value with 2 digits
     */
    currencyValue(sValue) {
      if (!sValue) {
        return '';
      }

      return parseFloat(sValue).toFixed(2);
    },

    getPosition() {
      const oViewModel = this.getViewModel();

      if(!oViewModel.getProperty("/TargetInfo/Zzjikgbt")) return; 

      return `${oViewModel.getProperty("/TargetInfo/Zzjikgbt")}/${oViewModel.getProperty("/TargetInfo/Zzjiktlt")}`;
    },

    setAppdt(vAppdt) {
      if(typeof vAppdt === "string") {
        return `${vAppdt.slice(0, 4)}.${vAppdt.slice(4, 6)}.${vAppdt.slice(6, 8)}, ${vAppdt.slice(9, 11)}:${vAppdt.slice(11, 13)}`;
      }else if(typeof vAppdt === "object") {
        const vDate = vAppdt.toLocaleString();
        const vTime = vAppdt.toTimeString();
        
        return `${vDate.slice(0, 5)}${vDate.slice(6, 9)}${vDate.slice(10, 11)}, ${vTime.slice(0,2)}:${vTime.slice(3,5)}`
      }

      return "";
    },

    onInfoMsgClose() {
      this.byId('InfoMegBox').setVisible(false);
    },

    getDocnoTxt(sDocno) {
      return sDocno === '00000000000000' ? '' : sDocno;
    },

    rowHighlight(sValue) {
      switch (sValue) {
        case '10':
        case '90':
          return sap.ui.core.IndicationColor.Indication01;
        case '20':
        case '30':
        case '50':
          return sap.ui.core.IndicationColor.Indication03;
        case '40':
          return sap.ui.core.IndicationColor.Indication04;
        case '45':
        case '65':
          return sap.ui.core.IndicationColor.Indication02;
        case '60':
          return sap.ui.core.IndicationColor.Indication05;
        default:
          return null;
      }
    },

    onCloseClick() {
      this.byId('listFileDialog').close();
    },

    onFileListDialog(oEvent) {
      // load asynchronous XML fragment
      const vPath = oEvent.getSource().getBindingContext().getPath();
      const oRowData = this.getViewModel().getProperty(vPath);

      if (!this.byId('listFileDialog')) {
        Fragment.load({
          id: this.getView().getId(),
          name: 'sap.ui.yesco.fragment.ListFileView',
          controller: this,
        }).then((oDialog) => {
          // connect dialog to the root view of this component (models, lifecycle)
          this.getView().addDependent(oDialog);
          oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
          this.AttachFileAction.setTableFileList(this, oRowData);
          oDialog.open();
        });
      } else {
        this.AttachFileAction.setTableFileList(this, oRowData);
        this.byId('listFileDialog').open();
      }
    },
  };
});
