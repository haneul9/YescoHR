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
      async readData(sAppno, sApptp, iZfileseq) {
        const aFiles = await this.read(sAppno, sApptp, iZfileseq);
        const mFile = aFiles[0] || {};

        mFile.New = false;
        mFile.Deleted = false;

        return mFile;
      },

      async readListData(sAppno, sApptp) {
        const aFiles = await this.read(sAppno, sApptp);

        aFiles.forEach((mFile) => {
          mFile.New = false;
          mFile.Deleted = false;
        });

        return aFiles;
      },

      async read(sAppno, sZworktyp, iZfileseq) {
        return new Promise((resolve, reject) => {
          const oServiceModel = AppUtils.getAppComponent().getModel(ServiceNames.COMMON);
          const sUrl = '/FileListSet';
          const aFilters = [
            new Filter('Appno', FilterOperator.EQ, sAppno), // prettier 방지용 주석
            new Filter('Zworktyp', FilterOperator.EQ, sZworktyp),
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
    };
  }
);
