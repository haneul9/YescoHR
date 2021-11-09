sap.ui.define(
  [
    'sap/ui/export/library', //
    'sap/ui/export/Spreadsheet',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  (
    exportLibrary, //
    Spreadsheet,
    Fragment,
  ) => {
    'use strict';

    /**
     * @constant {number} 임시저장
     */
    const STATE_IN_PROGRESS1 = 10;
    /**
     * @constant {number} 결재취소
     */
    const STATE_IN_PROGRESS2 = 90;
    /**
     * @constant {number} 신청완료
     */
    const STATE_APPLY1 = 20;
    /**
     * @constant {number} 담당자 접수
     */
    const STATE_APPLY2 = 30;
    /**
     * @constant {number} 결재 기안
     */
    const STATE_APPLY3 = 50;
    /**
     * @constant {number} 담당자 승인
     */
    const STATE_APPROVE = 40;
    /**
     * @constant {number} 담당자 반려
     */
    const STATE_REJECT1 = 45;
    /**
     * @constant {number} 결재 반려
     */
    const STATE_REJECT2 = 65;
    /**
     * @constant {number} 결재 승인
     */
    const STATE_COMPLETE = 60;

    return {
      /**************************
       * Functions
       *************************/
      count(mTableData) {
        const oViewModel = this.getViewModel();
        const aZappStatAls = _.map(mTableData, 'ZappStatAl');
        const oOccurCount = _.defaults(_.countBy(aZappStatAls), {
          [STATE_IN_PROGRESS1]: 0,
          [STATE_IN_PROGRESS2]: 0,
          [STATE_APPLY1]: 0,
          [STATE_APPLY2]: 0,
          [STATE_APPLY3]: 0,
          [STATE_APPROVE]: 0,
          [STATE_REJECT1]: 0,
          [STATE_REJECT2]: 0,
          [STATE_COMPLETE]: 0,
        });

        oViewModel.setProperty('/listinfo', {
          rowCount: aZappStatAls.length > 10 ? 10 : aZappStatAls.length || 1,
          totalCount: aZappStatAls.length,
          progressCount: oOccurCount[STATE_IN_PROGRESS1] + oOccurCount[STATE_IN_PROGRESS2],
          applyCount: oOccurCount[STATE_APPLY1] + oOccurCount[STATE_APPLY2] + oOccurCount[STATE_APPLY3],
          approveCount: oOccurCount[STATE_APPROVE],
          rejectCount: oOccurCount[STATE_REJECT1] + oOccurCount[STATE_REJECT2],
          completeCount: oOccurCount[STATE_COMPLETE],
        });
      },

      export({ oTable, mTableData, sFileName }) {
        if (!mTableData.length) return;

        const sToday = moment().format('YYYYMMDD');
        const mColumns = oTable.getColumns().map((col) => ({
          label: col.getLabel().getText(),
          property: !!col.getTemplate().getBindingInfo('text') ? col.getTemplate().getBindingInfo('text').parts[0].path : col.getTemplate().getBindingInfo('visible').parts[0].path,
          type: exportLibrary.EdmType.String,
        }));

        const oSettings = {
          workbook: {
            columns: mColumns,
            hierarchyLevel: 'Level',
          },
          dataSource: mTableData,
          fileName: `${sFileName}_${sToday}.xlsx`,
          worker: false,
        };

        const oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(function () {
          oSheet.destroy();
        });
      },

      /**
       * @param {Object} o = {
       * 		table: sap.ui.table.Table instance
       * 		colIndices: rowspan을 적용할 column index array
       * 		theadOrTbody: "header" or "table"
       * 	}
       */
      adjustRowSpan(o) {
        if (!o.colIndices.length) return;

        o.colIndices.forEach((colIndex) => {
          const sId = `#${o.table.getId()}-${o.theadOrTbody} tbody>tr td:nth-child(${colIndex + 1}):visible`;
          const $Tds = $(sId).get();
          const $PrevTD = $Tds.shift();

          $Tds.forEach((td) => {
            const p = $($PrevTD);
            const c = $(td);
            if (c.text() === p.text()) {
              p.attr('rowspan', Number(p.attr('rowspan') || 1) + 1);
              c.hide();
            } else {
              $PrevTD = td;
            }
          });
        });
      },

      /**************************
       * Formatter
       *************************/
      rowHighlight(sValue) {
        switch (parseInt(sValue, 10)) {
          case STATE_IN_PROGRESS1:
          case STATE_IN_PROGRESS2:
            // 작성중
            return sap.ui.core.IndicationColor.None;
          case STATE_APPLY1:
          case STATE_APPLY2:
          case STATE_APPLY3:
            // 신청
            return sap.ui.core.IndicationColor.Indication03;
          case STATE_APPROVE:
            // 승인
            return sap.ui.core.IndicationColor.Indication04;
          case STATE_REJECT1:
          case STATE_REJECT2:
            // 반려
            return sap.ui.core.IndicationColor.Indication02;
          case STATE_COMPLETE:
            // 완료
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return null;
        }
      },

      StatusTxt(sValue) {
        switch (parseInt(sValue, 10)) {
          case STATE_IN_PROGRESS1:
          case STATE_IN_PROGRESS2:
            // 작성중
            return "작성중";
          case STATE_APPLY1:
          case STATE_APPLY2:
          case STATE_APPLY3:
            // 신청
            return "신청";
          case STATE_APPROVE:
            // 승인
            return "승인";
          case STATE_REJECT1:
          case STATE_REJECT2:
            // 반려
            return "반려";
          case STATE_COMPLETE:
            // 완료
            return "완료";
          default:
            return null;
        }
      },

      onFileListDialog(oEvent) {
        // load asynchronous XML fragment
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);
  
        this.getViewModel().setProperty("/Data", {busy: true});
        
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
  }
);
