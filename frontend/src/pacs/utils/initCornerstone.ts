import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';



export default async function initCornerstone() {
  if (cornerstone.getEnabledElements().length > 0) {
    return; // Already initialized
  }
  
  // 1. Initialize cornerstone core
  await cornerstone.init();
  
  // 2. Initialize cornerstone tools
  await cornerstoneTools.init();

  // 3. Configure DICOM image loader (Cornerstone3D / v5 approach)
  cornerstoneDICOMImageLoader.init({
    maxWebWorkers: navigator.hardwareConcurrency ? Math.max(1, Math.floor(navigator.hardwareConcurrency / 2)) : 1,
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

  console.log("Cornerstone3D Initialized successfully.");
}
