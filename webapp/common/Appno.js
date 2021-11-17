sap.ui.define(
    [
      // prettier 방지용 주석
      'sap/ui/yesco/control/MessageBox',
      'sap/ui/yesco/common/odata/ServiceNames',
    ],
    (MessageBox, ServiceNames) =>
      // prettier 방지용 주석
      {
        'use strict';
  
        return {
          get() {
            return new Promise((resolve) => {
              const oModel = this.getModel(ServiceNames.COMMON);
              let vAppno = '';
  
              oModel.read('/CreateAppnoSet', {
                  success: function (oData) {
                      if (oData) {
                          vAppno = oData.results[0].Appno;
  
                          resolve(vAppno);
                      }
                  },
                  error: function (oRespnse) {
                      console.log(oRespnse);
                      const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
                      MessageBox.alert(vErrorMSG);
                      
                      resolve(vAppno);
                  },
              });
            });
          },
        };
      }
  );
  