sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    ServiceNames
  ) => {
    'use strict';

    return {
      async readData(sAppno, sZworktype, iZfileseq) {
        const aFiles = await this.read(sAppno, sZworktype, iZfileseq);
        const mFile = aFiles[0] || {};

        mFile.New = false;
        mFile.Deleted = false;
        if (mFile.Seqnr) {
          mFile.Seqnr = Number(mFile.Seqnr);
        }

        return mFile;
      },

      async readListData(sAppno, sZworktype) {
        const aFiles = await this.read(sAppno, sZworktype);

        aFiles.forEach((mFile) => {
          mFile.New = false;
          mFile.Deleted = false;
          if (mFile.Seqnr) {
            mFile.Seqnr = Number(mFile.Seqnr);
          }
        });

        return aFiles;
      },

      async read(sAppno, sZworktype, iZfileseq) {
        return new Promise((resolve, reject) => {
          const oServiceModel = AppUtils.getAppComponent().getModel(ServiceNames.COMMON);
          const sUrl = '/FileListSet';
          const aFilters = [
            new Filter('Appno', FilterOperator.EQ, sAppno), // prettier 방지용 주석
            new Filter('Zworktyp', FilterOperator.EQ, sZworktype),
          ];

          if (typeof iZfileseq !== 'undefined') {
            aFilters.push(new Filter('Zfileseq', FilterOperator.EQ, iZfileseq));
          }

          oServiceModel.read(sUrl, {
            filters: aFilters,
            success: (mData) => {
              resolve((mData || {}).results || []);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject({ code: 'E', message: AppUtils.getBundleText('MSG_00045') }); // 파일을 조회할 수 없습니다.
            },
          });
        });
      },

      /**
       * 첨부파일 링크 Click
       */
      onPressFileLink(oEvent) {
        const sFileuri = oEvent.getSource().getBindingContext().getProperty('Fileuri');
        this.openFileLink(sFileuri, '_blank');
      },

      openFileLink(sUrl) {
        if (_.isEmpty(sUrl)) {
          return;
        }
        window.open(sUrl, '_blank');
      },
    };
  }
);
