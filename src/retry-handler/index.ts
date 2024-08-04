import CircuitBreaker from "opossum";

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;

export async function retryAndBreakerOperation<T>(operation: () => Promise<T>) {
  let retries = 0;
  let retryDelay = BASE_RETRY_DELAY;
  let circuitBreakerOpened = false;

  const increaseRetryDelay = () => {
    retryDelay *= 2;
    return Math.min(retryDelay, 60000);
  };

  const circuitBreaker = new CircuitBreaker(operation, {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  });

  circuitBreaker.on("open", () => {
    console.log("Circuit breaker open");
    circuitBreakerOpened = true;
  });

  circuitBreaker.on("halfOpen", () => {
    console.log("Circuit breaker half open");
    circuitBreakerOpened = false;
  });

  circuitBreaker.on("close", () => {
    console.log("Circuit breaker closed");
    circuitBreakerOpened = false;
  });

  while (retries < MAX_RETRIES) {
    try {
      if (!circuitBreakerOpened) {
        return await circuitBreaker.fire();
      } else {
        console.log("Circuit breaker is open or half open. Retry", retries);
        retries++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay = increaseRetryDelay();
      }
    } catch (error) {
      if (retries === MAX_RETRIES - 1) {
        throw error;
      } else {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay = increaseRetryDelay();
      }
    }
  }

  circuitBreaker.open();
}
