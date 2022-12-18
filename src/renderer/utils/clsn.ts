export default (classNameConds: Record<string, boolean>) =>
  Object.keys(classNameConds)
    .filter((k) => classNameConds[k])
    .join(' ');
