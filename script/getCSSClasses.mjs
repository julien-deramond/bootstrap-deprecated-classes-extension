import listSelectors from 'list-selectors';

export async function getCSSClasses(filePath) {
  return new Promise((resolve, reject) => {
    listSelectors(filePath, { include: ['classes'] }, (result) => {
      resolve(result);
    });
  })
}
