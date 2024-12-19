import Reflexor from './Reflexor';
import ReflexorRenderer from './ReflexorRenderer';

const isNode = typeof window === 'undefined';

const ReflexorExports = {
    Reflexor,
    ...(isNode ? {} : { ReflexorRenderer: new ReflexorRenderer() }), // Include ReflexorRenderer only in non-Node environments
};

export default ReflexorExports;