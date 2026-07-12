import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

let initialized = false;

export default async function initCornerstone() {
  if (initialized) {
    return; // Already initialized
  }
  
  // 1. Initialize cornerstone core
  await cornerstone.init();
  initialized = true;
  
  // 2. Initialize cornerstone tools
  await cornerstoneTools.init();

  // 3. Configure DICOM image loader (Cornerstone3D / v5 approach)
  cornerstoneDICOMImageLoader.init({
    maxWebWorkers: navigator.hardwareConcurrency ? Math.max(1, Math.floor(navigator.hardwareConcurrency / 2)) : 1,
    beforeSend: function (xhr: XMLHttpRequest) {
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
    },
  });

  // 4. Register Metadata Providers
  cornerstone.metaData.addProvider(
    cornerstoneDICOMImageLoader.wadouri.metaData.metaDataProvider,
    10000
  );
  cornerstone.metaData.addProvider(
    cornerstoneDICOMImageLoader.wadors.metaData.metaDataProvider,
    10000
  );

  // 5. Fallback Metadata Provider
  // Muitas imagens (como CR ou Testes) não possuem as tags 3D (PixelSpacing, ImagePositionPatient).
  // Se elas faltarem, as ferramentas de medição do Cornerstone3D cracham silenciosamente.
  // Esse fallback provê 1mm de espaçamento padrão para que as ferramentas funcionem.
  cornerstone.metaData.addProvider((type: string) => {
    if (type === 'imagePlaneModule') {
      return {
        rowCosines: [1, 0, 0],
        columnCosines: [0, 1, 0],
        imagePositionPatient: [0, 0, 0],
        rowPixelSpacing: 1, // 1mm default
        columnPixelSpacing: 1, // 1mm default
        frameOfReferenceUID: 'fallback-uid-12345',
      };
    }
    return undefined;
  }, 9999); // Prioridade 9999 (roda DEPOIS do wadouri que tem 10000)

  console.log("Cornerstone3D Initialized successfully.");
}
